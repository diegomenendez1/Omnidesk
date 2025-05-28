
"use client";

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';
import type { User } from '@/types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Trash2, Edit3, UserPlus, Users, ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { inviteUserAction, getUsersAction, deleteUserFirestoreRecordAction, updateUserRoleAction } from './actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type UserRole = 'owner' | 'admin' | 'user';

export default function UserManagementPage() {
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  const { toast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Form state for inviting new user
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('user');

  // State for editing role
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newRoleForEdit, setNewRoleForEdit] = useState<UserRole>('user');
  
  // State for user deletion confirmation
  const [userToDelete, setUserToDelete] = useState<User | null>(null);


  useEffect(() => {
    if (!authLoading) {
      if (!currentUser || (currentUser.role !== 'owner' && currentUser.role !== 'admin')) {
        toast({
          title: "Acceso Denegado",
          description: "No tienes permisos para acceder a esta página.",
          variant: "destructive",
        });
        router.replace('/dashboard');
      } else {
        fetchUsers();
      }
    }
  }, [currentUser, authLoading, router, toast]);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const fetchedUsers = await getUsersAction();
      setUsers(fetchedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error al cargar usuarios",
        description: "No se pudieron obtener los datos de los usuarios.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.uid) {
        toast({ title: "Error", description: "No se pudo identificar al creador.", variant: "destructive"});
        return;
    }
    startTransition(async () => {
      const result = await inviteUserAction({ email: inviteEmail, name: inviteName, role: inviteRole, creatorUid: currentUser.uid });
      if (result.success) {
        toast({
          title: t('pageHeader.admin.userAddedSuccessfully'),
          description: `El registro para ${inviteEmail} ha sido creado.`,
        });
        setInviteEmail('');
        setInviteName('');
        setInviteRole('user');
        fetchUsers(); // Refresh the user list
      } else {
        toast({
          title: t('pageHeader.admin.errorAddingUser'),
          description: result.error || "Ocurrió un error desconocido.",
          variant: "destructive",
        });
      }
    });
  };

  const handleOpenEditModal = (userToEdit: User) => {
    setEditingUser(userToEdit);
    setNewRoleForEdit(userToEdit.role || 'user');
  };

  const handleUpdateUserRole = async () => {
    if (!editingUser || !editingUser.uid) return;
    startTransition(async () => {
      const result = await updateUserRoleAction(editingUser.uid!, newRoleForEdit);
      if (result.success) {
        toast({
          title: "Rol Actualizado",
          description: `El rol de ${editingUser.email} ha sido actualizado a ${newRoleForEdit}.`,
        });
        fetchUsers();
        setEditingUser(null);
      } else {
        toast({
          title: "Error al actualizar rol",
          description: result.error || "Ocurrió un error desconocido.",
          variant: "destructive",
        });
      }
    });
  };
  
  const handleDeleteUser = async () => {
    if (!userToDelete || !userToDelete.uid) return;
    startTransition(async () => {
      // Prevent owner from deleting themselves or other owners
      if (currentUser?.uid === userToDelete.uid) {
        toast({ title: "Acción no permitida", description: "No puedes eliminar tu propia cuenta.", variant: "destructive" });
        setUserToDelete(null);
        return;
      }
      if (userToDelete.role === 'owner' && userToDelete.uid !== currentUser?.uid) {
         toast({ title: "Acción no permitida", description: "No puedes eliminar a otro propietario.", variant: "destructive" });
         setUserToDelete(null);
         return;
      }

      const result = await deleteUserFirestoreRecordAction(userToDelete.uid!);
      if (result.success) {
        toast({
          title: "Registro de Usuario Eliminado",
          description: `El registro de Firestore para ${userToDelete.email} ha sido eliminado.`,
        });
        fetchUsers();
      } else {
        toast({
          title: "Error al eliminar registro",
          description: result.error || "Ocurrió un error desconocido.",
          variant: "destructive",
        });
      }
      setUserToDelete(null);
    });
  };


  if (authLoading || (!currentUser && !authLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!currentUser || (currentUser.role !== 'owner' && currentUser.role !== 'admin')) {
     // This case should be handled by the redirect in useEffect, 
     // but as a fallback or if redirect hasn't happened yet:
    return <div className="p-4">Redirigiendo...</div>;
  }

  const roleOptions: { value: UserRole; labelKey: string, icon: React.ElementType }[] = [
    { value: 'owner', labelKey: 'pageHeader.admin.roleOwner', icon: ShieldAlert },
    { value: 'admin', labelKey: 'pageHeader.admin.roleAdmin', icon: ShieldCheck },
    { value: 'user', labelKey: 'pageHeader.admin.roleUser', icon: ShieldQuestion },
  ];


  return (
    <div className="space-y-8 p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-6 w-6" />
            {t('pageHeader.admin.addNewUser')}
          </CardTitle>
          <CardDescription>
            Crea un registro en Firestore para un nuevo usuario y asígnale un rol. El usuario deberá completar su registro o iniciar sesión.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInviteUser} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="inviteName">{t('pageHeader.admin.nameLabel')}</Label>
                <Input
                  id="inviteName"
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Nombre Apellido"
                  required
                />
              </div>
              <div>
                <Label htmlFor="inviteEmail">{t('pageHeader.admin.emailLabel')}</Label>
                <Input
                  id="inviteEmail"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="usuario@ejemplo.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="inviteRole">{t('pageHeader.admin.roleLabel')}</Label>
                <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as UserRole)}>
                  <SelectTrigger id="inviteRole">
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map(option => (
                         <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                                <option.icon className="h-4 w-4" />
                                {t(option.labelKey as any)}
                            </div>
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" disabled={isPending} className="w-full md:w-auto">
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              {t('pageHeader.admin.addUserButton')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            {t('pageHeader.admin.userManagement')}
          </CardTitle>
          <CardDescription>
            Visualiza y gestiona los usuarios registrados en Firestore y sus roles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingUsers ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : users.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('pageHeader.admin.emailLabel')}</TableHead>
                    <TableHead>{t('pageHeader.admin.nameLabel')}</TableHead>
                    <TableHead>{t('pageHeader.admin.roleLabel')}</TableHead>
                    <TableHead>Fecha de Creación</TableHead>
                    <TableHead>Creado por</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.uid}>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.name || 'N/A'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          user.role === 'owner' ? 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300' :
                          user.role === 'admin' ? 'bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-300' :
                                                  'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300'
                        }`}>
                          {user.role ? t(`pageHeader.admin.role${user.role.charAt(0).toUpperCase() + user.role.slice(1)}` as any, user.role) : 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>{user.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString() : 'N/A'}</TableCell>
                       <TableCell>{user.createdBy === user.uid ? 'Auto-registrado' : (users.find(u => u.uid === user.createdBy)?.email || user.createdBy || 'Sistema')}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => handleOpenEditModal(user)} disabled={isPending || currentUser?.uid === user.uid || (user.role === 'owner' && user.uid !== currentUser?.uid )}>
                              <Edit3 className="h-4 w-4" />
                              <span className="sr-only">Editar Rol</span>
                            </Button>
                          </AlertDialogTrigger>
                           {editingUser && editingUser.uid === user.uid && (
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Editar Rol de {editingUser.email}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Selecciona el nuevo rol para este usuario.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <div className="py-4">
                                <Label htmlFor="editRole">Nuevo Rol</Label>
                                <Select value={newRoleForEdit} onValueChange={(value) => setNewRoleForEdit(value as UserRole)}>
                                  <SelectTrigger id="editRole">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                     {roleOptions.map(option => (
                                        // No permitir asignar 'owner' si el editor no es owner, o si se intenta cambiar el rol del owner actual.
                                        // No permitir degradar al owner actual.
                                        (option.value === 'owner' && (currentUser?.role !== 'owner' || editingUser.uid === currentUser?.uid)) ? null :
                                        <SelectItem key={option.value} value={option.value}>
                                            <div className="flex items-center gap-2">
                                                <option.icon className="h-4 w-4" />
                                                {t(option.labelKey as any)}
                                            </div>
                                        </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setEditingUser(null)}>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleUpdateUserRole} disabled={isPending}>
                                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Guardar Cambios
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          )}
                        </AlertDialog>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" onClick={() => setUserToDelete(user)} disabled={isPending || currentUser?.uid === user.uid || user.role === 'owner'}>
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Eliminar</span>
                            </Button>
                          </AlertDialogTrigger>
                          {userToDelete && userToDelete.uid === user.uid && (
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Confirmar Eliminación?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Estás a punto de eliminar el registro de Firestore para {userToDelete.email}. Esta acción no se puede deshacer. El usuario no será eliminado de Firebase Authentication.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteUser} disabled={isPending} className={buttonVariants({ variant: "destructive" })}>
                                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Eliminar Registro
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          )}
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-10">No hay usuarios registrados en Firestore.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
