import { requireAuth } from "@/lib/auth-utils";
import { SettingsForm } from "./_components/settings-form";
import { prisma } from "@/lib/db";

export default async function SettingsPage() {
  const user = await requireAuth();

  const userProfile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      name: true,
      email: true,
      jobTitle: true,
      jobDescription: true,
      reviewDate: true,
    }
  });

  if (!userProfile) {
    // This should not happen if user is authenticated
    return <div>User not found.</div>
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <p className="text-muted-foreground mb-8">
        Update your profile and application settings.
      </p>
      <SettingsForm userProfile={userProfile} />
    </div>
  );
} 