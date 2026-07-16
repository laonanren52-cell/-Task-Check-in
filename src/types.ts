export type Status='todo'|'doing'|'done'|'missed'|'cancelled'; export type Priority='P1'|'P2'|'P3';
export interface Category { id:string; name:string; color:string; icon:string; order:number; createdAt:string }
export interface Task { id:string; date:string; themeId:string; subjectId:string; templateId?:string; title:string; detail:string; priority:Priority; status:Status; plannedDuration:number; actualDuration:number; focusScore:number; energyScore:number; result:string; note:string; order:number; createdAt:string; updatedAt:string }
export interface Checkin { id:string; date:string; gain:string; problem:string; proud:string; nextStep:string; mood:number; completedAt:string; isMakeup?:boolean }
export interface Template { id:string; name:string; detail:string; themeId?:string; subjectId?:string; plannedDuration:number; createdAt:string }
export type Page='today'|'tasks'|'calendar'|'insights'|'settings';
