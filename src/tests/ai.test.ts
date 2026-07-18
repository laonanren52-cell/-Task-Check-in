import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SummerFlowDatabase } from '../db/database'
import { defaultAIPreferences, defaultMeta, defaultSettings } from '../db/defaults'
import { buildAIContext } from '../features/ai/services/contextBuilder'
import { aiDailyInsightSchema, aiReviewDraftSchema, aiTaskBreakdownSchema, aiTaskPlanSchema, parseAIJson } from '../features/ai/schemas/aiResponses'
import { AIClientError, callAI, getProviderCapability } from '../features/ai/services/aiClient'
import { backupSchema } from '../features/backup/schema'
import type { AIConfig, Task } from '../types'

const names: string[] = []
afterEach(async()=>{for(const name of names)await Dexie.delete(name);names.length=0;vi.unstubAllGlobals()})
const task: Task = { id:'task-1',date:'2026-07-18',themeId:'theme',subjectId:'subject',name:'C pointer',detail:'practice',priority:'P1',status:'todo',plannedDuration:60,actualDuration:20,focusScore:4,energyScore:3,output:'',note:'',order:0,createdAt:'2026-07-18',updatedAt:'2026-07-18' }

describe('SummerFlow AI',()=>{
  it('validates structured task results and rejects malformed output',()=>{
    expect(parseAIJson('[{"title":"Review C pointers","priority":"P1","plannedDuration":60,"subtasks":["arrays"],"reason":"foundation first"}]',aiTaskPlanSchema)[0].title).toBe('Review C pointers')
    expect(parseAIJson('{"suitableForOneDay":false,"steps":[{"title":"Define scope","estimatedMinutes":20},{"title":"Verify","estimatedMinutes":30}]}',aiTaskBreakdownSchema).steps).toHaveLength(2)
    expect(()=>parseAIJson('{"title":"missing array"}',aiTaskPlanSchema)).toThrow('AI 返回格式异常')
  })
  it('accepts AI JSON wrapped in prose, Markdown, or a JSON string',()=>{
    const task = '[{"title":"Review C pointers","priority":"P1","plannedDuration":60,"subtasks":["arrays"],"reason":"foundation first"}]'
    expect(parseAIJson(`建议如下：\n${task}`,aiTaskPlanSchema)).toHaveLength(1)
    expect(parseAIJson(`这是今天的分析：\n\`\`\`json\n{"summary":"进度稳定","facts":["完成 1 项任务"],"inferences":[],"suggestions":[]}\n\`\`\``,aiDailyInsightSchema).summary).toBe('进度稳定')
    expect(parseAIJson(JSON.stringify(task),aiTaskPlanSchema)[0].priority).toBe('P1')
  })
  it('repairs one common trailing-comma response but still rejects invalid shapes',()=>{
    const response = '{"summary":"进度稳定","facts":["完成 1 项任务",],"inferences":[],"suggestions":[],}'
    expect(parseAIJson(response,aiDailyInsightSchema).facts).toEqual(['完成 1 项任务'])
    expect(()=>parseAIJson('今天做得不错',aiDailyInsightSchema)).toThrow('AI 返回格式异常')
  })
  it('falls back when an OpenAI-compatible provider rejects response_format',async()=>{
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error:{ message:'response_format is unsupported' } }),{status:400}))
      .mockResolvedValueOnce(new Response(JSON.stringify({ choices:[{ finish_reason:'stop', message:{ content:'{"summary":"稳定","facts":[],"inferences":[],"suggestions":[]}' } }], usage:{total_tokens:25} }),{status:200}))
    vi.stubGlobal('fetch',fetchMock)
    const result=await callAI({id:'ai',displayName:'Test',provider:'custom',baseUrl:'https://example.com/v1',model:'model',enabled:true,isDefault:true,createdAt:'',updatedAt:''},'not-logged',{system:'test',prompt:'return JSON',jsonMode:'object'})
    expect(result.text).toContain('summary');expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(JSON.parse(String(fetchMock.mock.calls[0][1].body)).response_format).toEqual({type:'json_object'})
    expect(JSON.parse(String(fetchMock.mock.calls[1][1].body)).response_format).toBeUndefined()
  })
  it('uses DeepSeek json_object and only parses message.content, never reasoning_content',async()=>{
    const fetchMock=vi.fn().mockResolvedValue(new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{reasoning_content:'this is chain of thought, not JSON',content:'{"summary":"稳定","facts":[],"inferences":[],"suggestions":[]}'}}],usage:{total_tokens:55}}),{status:200}))
    vi.stubGlobal('fetch',fetchMock)
    const config:AIConfig={id:'deepseek',displayName:'DeepSeek',provider:'deepseek',baseUrl:'https://api.deepseek.com',model:'deepseek-v4-pro',enabled:true,isDefault:true,createdAt:'',updatedAt:''}
    const result=await callAI(config,'not-logged',{system:'Return JSON',prompt:'Return JSON',jsonMode:'object'})
    expect(JSON.parse(result.text).summary).toBe('稳定');expect(result.hasReasoningContent).toBe(true)
    const body=JSON.parse(String(fetchMock.mock.calls[0][1].body))
    expect(body.response_format).toEqual({type:'json_object'});expect(body.thinking).toEqual({type:'enabled'});expect(body.reasoning_effort).toBe('high');expect(body.max_tokens).toBeGreaterThanOrEqual(4096)
  })
  it('never selects json_schema for official DeepSeek V4, including legacy OpenAI-compatible configs',()=>{
    const capability=getProviderCapability({id:'deepseek',displayName:'DeepSeek',provider:'openai-compatible',baseUrl:'https://api.deepseek.com',model:'deepseek-v4-pro',enabled:true,isDefault:true,createdAt:'',updatedAt:''})
    expect(capability).toMatchObject({adapter:'deepseek',supportsJsonObject:true,supportsJsonSchema:false,parser:'content-only'})
  })
  it('retries one DeepSeek empty content response instead of parsing reasoning_content',async()=>{
    const fetchMock=vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{reasoning_content:'only thinking',content:''}}]}),{status:200}))
      .mockResolvedValueOnce(new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{content:'{"summary":"recovered","facts":[],"inferences":[],"suggestions":[]}'}}]}),{status:200}))
    vi.stubGlobal('fetch',fetchMock)
    const result=await callAI({id:'deepseek',displayName:'DeepSeek',provider:'deepseek',baseUrl:'https://api.deepseek.com',model:'deepseek-v4-pro',enabled:true,isDefault:true,createdAt:'',updatedAt:''},'not-logged',{system:'Return JSON',prompt:'Return JSON',jsonMode:'object'})
    expect(fetchMock).toHaveBeenCalledTimes(2);expect(JSON.parse(result.text).summary).toBe('recovered')
  })
  it('accepts the DeepSeek organizer overall field while keeping the UI review field stable',()=>{
    expect(parseAIJson('{"overall":"今天推进顺利","achievement":"完成实验"}',aiReviewDraftSchema).review).toBe('今天推进顺利')
  })
  it('identifies a token-truncated response before JSON parsing',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({choices:[{finish_reason:'length',message:{content:'{"summary":"partial"'}}]}),{status:200})))
    await expect(callAI({id:'ai',displayName:'Test',provider:'openai-compatible',baseUrl:'https://example.com/v1',model:'model',enabled:true,isDefault:true,createdAt:'',updatedAt:''},'not-logged',{system:'test',prompt:'return JSON',jsonMode:'object'})).rejects.toMatchObject({code:'TRUNCATED'} satisfies Partial<AIClientError>)
  })
  it('filters private learning fields from AI context when permissions are off',()=>{
    const context=buildAIContext({tasks:[task],dailyRecords:[],themes:[{id:'theme',name:'Project',color:'#000',icon:'Book',order:0,createdAt:'',updatedAt:''}],subjects:[{id:'subject',name:'C',color:'#000',order:0,createdAt:'',updatedAt:''}],templates:[],settings:defaultSettings(),permissions:{tasks:false,durations:false,focus:false,reviews:false,goals:false,recentHistory:false}},task.date)
    expect(context.todayTasks).toEqual([]);expect(context.unfinishedPriorityTasks).toEqual([]);expect('recentTasks' in context).toBe(false);expect('goals' in context).toBe(false)
  })
  it('only accepts redacted API keys in normal JSON backups',()=>{
    const valid={schemaVersion:4,exportedAt:'2026-07-18',settings:defaultSettings(),themes:[],subjects:[],templates:[],tasks:[],dailyRecords:[],aiConfigs:[{id:'ai',displayName:'Test',provider:'openai-compatible',baseUrl:'https://example.com/v1',model:'model',enabled:true,isDefault:true,createdAt:'2026-07-18',updatedAt:'2026-07-18',apiKey:null}]}
    expect(backupSchema.parse(valid).aiConfigs?.[0].apiKey).toBeNull()
    expect(()=>backupSchema.parse({...valid,aiConfigs:[{...valid.aiConfigs[0],apiKey:'secret'}]})).toThrow()
  })
  it('keeps existing tasks after Dexie v4 upgrade and saves AI metadata',async()=>{
    const name=`ai-upgrade-${Date.now()}`;names.push(name);const old=new Dexie(name);old.version(3).stores({settings:'id',themes:'id,order,name',subjects:'id,order,name',templates:'id,order',tasks:'id,date,status,themeId,subjectId,order,updatedAt',dailyRecords:'date,checkedIn',appMeta:'key'});await old.open();await old.table('settings').put(defaultSettings());await old.table('tasks').put(task);await old.table('appMeta').put({...defaultMeta(),schemaVersion:3});old.close()
    const current=new SummerFlowDatabase(name);await current.open();const config:AIConfig={id:'ai',displayName:'Local',provider:'custom',baseUrl:'http://127.0.0.1:11434/v1',model:'qwen',enabled:true,isDefault:true,createdAt:'',updatedAt:''};await current.aiConfigs.put(config);await current.aiPreferences.put(defaultAIPreferences());expect((await current.tasks.get(task.id))?.name).toBe('C pointer');expect((await current.aiConfigs.get('ai'))?.model).toBe('qwen');current.close()
  })
})
