'use client';

import { useJiraAuth } from '@/hooks/use-jira-auth';
import { SettingsForm } from './_components/settings-form';
import { JiraConnect } from '@/components/jira/JiraConnect';
import { Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const { profile, isLoading, isConnected, jiraCloudId, disconnect } = useJiraAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) {
    // This could happen if fetching fails
    return <div>User profile not found. Please try again later.</div>;
  }
  
  // The userProfile for SettingsForm expects a specific shape.
  // We can create it from the profile data from the hook.
  const userProfile = {
    name: profile.name,
    email: profile.email,
    jobTitle: profile.jobTitle,
    jobDescription: profile.jobDescription,
    projects: profile.projects,
    reviewDate: profile.reviewDate,
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-12">
      <div>
        <h1 className="text-2xl font-bold mb-4">Settings</h1>
        <p className="text-muted-foreground mb-8">
          Update your profile and application settings.
        </p>
        <SettingsForm userProfile={userProfile} />
      </div>
      
      <div className="border-t pt-8">
        <h2 className="text-xl font-bold mb-4">Integrations</h2>
        <JiraConnect
          isConnected={isConnected}
          jiraCloudId={jiraCloudId}
          onDisconnect={disconnect}
        />
      </div>
    </div>
  );
} 