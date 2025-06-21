'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User } from '@prisma/client';

// Type for the profile data we expect from the API
type ProfileData = Omit<User, 'password' | 'jiraAccessToken' | 'jiraRefreshToken'>;

async function fetchProfile(): Promise<ProfileData> {
  const response = await fetch('/api/profile');
  if (!response.ok) {
    throw new Error('Failed to fetch profile');
  }
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch profile');
  }
  return result.data;
}

async function disconnectJira(): Promise<void> {
  const response = await fetch('/api/profile', {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to disconnect JIRA');
  }
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to disconnect JIRA');
  }
}

export function useJiraAuth() {
  const queryClient = useQueryClient();

  const { data: profile, isLoading, error } = useQuery<ProfileData>({
    queryKey: ['user-profile'],
    queryFn: fetchProfile,
  });

  const disconnectMutation = useMutation({
    mutationFn: disconnectJira,
    onSuccess: () => {
      // When disconnection is successful, refetch the profile data
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });

  return {
    profile,
    isLoading,
    error,
    isConnected: !!profile?.jiraConnectedAt,
    jiraCloudId: profile?.jiraCloudId,
    disconnect: disconnectMutation.mutateAsync,
    isDisconnecting: disconnectMutation.isPending,
  };
} 