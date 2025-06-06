
"use client";

import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, CheckCircle2, AlertCircle, CloudUpload, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/language-context';
import type { Task } from '@/types';
import { migrateTasksToFirestoreAction } from '@/app/migration/actions';
import { useAuth } from '@/context/AuthContext';

export function MigrationControls() {
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user } = useAuth(); // Get current user

  useEffect(() => {
    const storedTasksJson = localStorage.getItem('uploadedTasks');
    if (storedTasksJson) {
      try {
        const loadedTasks: Task[] = JSON.parse(storedTasksJson);
        if (loadedTasks && loadedTasks.length > 0) {
          setLocalTasks(loadedTasks);
        }
      } catch (error) {
        console.error("Error parsing local tasks for migration check:", error);
      }
    }
  }, []);

  const handleMigrate = () => {
    if (!user || !user.uid) {
      toast({
        title: t('migration.migrationErrorTitle'),
        description: "User not authenticated. Cannot perform migration.",
        variant: "destructive",
      });
      return;
    }
    if (localTasks.length === 0) {
      toast({ title: t('migration.noDataToMigrate'), variant: "default" });
      return;
    }

    startTransition(async () => {
      const result = await migrateTasksToFirestoreAction(localTasks, user.uid);
      if (result.success) {
        toast({
          title: t('migration.migrationSuccessTitle'),
          description: t('migration.migrationSuccessDescription', { count: result.migratedCount }),
          variant: "default",
          duration: 5000,
        });
        setShowDeleteConfirm(true); // Prompt to delete local data
      } else {
        toast({
          title: t('migration.migrationErrorTitle'),
          description: t('migration.migrationErrorDescription', { error: result.error || 'Unknown error' }),
          variant: "destructive",
          duration: 10000,
        });
      }
    });
  };

  const handleDeleteLocalData = () => {
    localStorage.removeItem('uploadedTasks');
    setLocalTasks([]); // Clear from state
    setShowDeleteConfirm(false);
    toast({ title: t('migration.localDataDeleted'), variant: "default" });
  };

  const handleKeepLocalData = () => {
    setShowDeleteConfirm(false);
    toast({ title: t('migration.localDataKept'), variant: "default" });
  };

  if (localTasks.length === 0) {
    return null; // Don't show anything if no local tasks
  }

  return (
    <>
      <Card className="mt-6 mb-6 border-primary shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <CloudUpload className="h-6 w-6" />
            {t('migration.localDataDetected')}
          </CardTitle>
          <CardDescription>
            {t('migration.localDataDetectedDescription', { count: localTasks.length })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleMigrate} disabled={isPending || localTasks.length === 0} className="w-full">
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CloudUpload className="mr-2 h-4 w-4" />
            )}
            {isPending ? t('migration.migratingButton') : t('migration.migrateButton')}
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('migration.deleteLocalDataDialogTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('migration.deleteLocalDataDialogDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={handleKeepLocalData}>
               {t('migration.keepLocalButton')}
            </Button>
            <AlertDialogAction onClick={handleDeleteLocalData} className="bg-destructive hover:bg-destructive/90">
              <Trash2 className="mr-2 h-4 w-4" />
              {t('migration.deleteLocalButton')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
    
    