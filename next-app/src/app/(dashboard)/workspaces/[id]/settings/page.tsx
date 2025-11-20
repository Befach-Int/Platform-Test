import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WorkspaceGeneralSettings } from '@/components/workspaces/settings/workspace-general-settings'
import { ModulesSettings } from '@/components/workspaces/settings/modules-settings'
import { FeaturesModuleSettings } from '@/components/workspaces/settings/features-module-settings'
import { WorkspacePermissionsSettings } from '@/components/workspaces/settings/workspace-permissions-settings'

export default async function WorkspaceSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get workspace
  const { data: workspace, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !workspace) {
    notFound()
  }

  // Get team info
  const { data: team } = await supabase
    .from('teams')
    .select('name, plan')
    .eq('id', workspace.team_id)
    .single()

  return (
    <Tabs defaultValue="general" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4 lg:w-auto">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="modules">Modules</TabsTrigger>
        <TabsTrigger value="features">Features</TabsTrigger>
        <TabsTrigger value="permissions">Permissions</TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="space-y-4">
        <WorkspaceGeneralSettings workspace={workspace} currentUserId={user?.id} />
      </TabsContent>

      <TabsContent value="modules" className="space-y-4">
        <ModulesSettings workspace={workspace} teamPlan={team?.plan || 'free'} />
      </TabsContent>

      <TabsContent value="features" className="space-y-4">
        <FeaturesModuleSettings workspaceId={workspace.id} />
      </TabsContent>

      <TabsContent value="permissions" className="space-y-4">
        <WorkspacePermissionsSettings workspace={workspace} currentUserId={user?.id} />
      </TabsContent>
    </Tabs>
  )
}
