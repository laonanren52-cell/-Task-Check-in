import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { useAppStore } from '../stores/appStore'
import { LoadingState } from '../components/ui/States'
import { RecoveryState } from '../components/ui/RecoveryState'
import { ToastProvider, useToast } from '../components/ui/Toast'
import { LegacyMigrationDialog } from '../components/ui/LegacyMigrationDialog'
import { PwaUpdate } from '../components/ui/PwaUpdate'
import { OnboardingDialog } from '../components/ui/OnboardingDialog'
import { DesktopRuntimeBridge } from '../desktop/updater/RuntimeBridge'
function Boot(){const{ready,error,initialize,migration}=useAppStore();const toast=useToast();useEffect(()=>{initialize()},[initialize]);useEffect(()=>{if(migration)toast(`已成功迁移旧版数据：${migration.tasks} 项任务，${migration.checkins} 天打卡`)},[migration,toast]);if(!ready)return <LoadingState/>;if(error)return <RecoveryState message={error}/>;return <><RouterProvider router={router}/><LegacyMigrationDialog/><OnboardingDialog/><DesktopRuntimeBridge/><PwaUpdate/></>}
export default function App(){return <ToastProvider><Boot/></ToastProvider>}
