import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel
} from '@mui/material';
import { Add, Delete, Edit } from '@mui/icons-material';
import { supabase, UserRole } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

const UserManagement: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // User form state
  const [openUserDialog, setOpenUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<UserRole>(UserRole.USER);
  const [generatePassword, setGeneratePassword] = useState(true);
  const [userPassword, setUserPassword] = useState('');

  useEffect(() => {
    if (!isAdmin()) {
      setError('You do not have permission to access this page');
      return;
    }
    
    fetchUsers();
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // In a real app, this would be a serverless function call with admin privileges
      // For demo purposes, we're using the client SDK
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at');

      if (error) {
        throw error;
      }

      setUsers(data || []);
    } catch (error: any) {
      setError(`Error fetching users: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const openAddUserDialog = () => {
    setEditingUser(null);
    setUserEmail('');
    setUserRole(UserRole.USER);
    setGeneratePassword(true);
    setUserPassword('');
    setOpenUserDialog(true);
  };

  const openEditUserDialog = (user: any) => {
    setEditingUser(user);
    setUserEmail(user.email || '');
    setUserRole(user.role as UserRole);
    setGeneratePassword(false);
    setUserPassword('');
    setOpenUserDialog(true);
  };

  const handleCloseUserDialog = () => {
    setOpenUserDialog(false);
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleSaveUser = async () => {
    if (!userEmail) {
      setError('Email is required');
      return;
    }

    if (!editingUser && generatePassword && !userPassword) {
      // Generate a random password
      setUserPassword(generateRandomPassword());
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (editingUser) {
        // Update existing user
        const { error } = await supabase
          .from('profiles')
          .update({
            role: userRole
          })
          .eq('id', editingUser.id);

        if (error) {
          throw error;
        }

        setSuccess('User updated successfully!');
      } else {
        // Create new user
        // In a real app, this would be a serverless function with admin privileges
        // For demo purposes, we're simulating the flow
        const { data, error } = await supabase.auth.signUp({
          email: userEmail,
          password: userPassword,
          options: {
            data: {
              role: userRole
            }
          }
        });

        if (error) {
          throw error;
        }

        setSuccess(`User created successfully! ${generatePassword ? `Password: ${userPassword}` : ''}`);
      }

      handleCloseUserDialog();
      fetchUsers();
    } catch (error: any) {
      setError(`Failed to ${editingUser ? 'update' : 'create'} user: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (id === user?.id) {
      setError('You cannot delete your own account');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      setLoading(true);
      
      // In a real app, this would be a serverless function with admin privileges
      // For demo purposes, we're using the client SDK
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setSuccess('User deleted successfully!');
      fetchUsers();
    } catch (error: any) {
      setError(`Failed to delete user: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin()) {
    return (
      <Paper elevation={3} sx={{ p: 3 }}>
        <Alert severity="error">You do not have permission to access this page</Alert>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">User Management</Typography>
        <Button 
          variant="contained" 
          startIcon={<Add />} 
          onClick={openAddUserDialog}
        >
          Add User
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {loading && !users.length ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : users.length === 0 ? (
        <Typography variant="body1" sx={{ p: 2 }}>No users found.</Typography>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => openEditUserDialog(user)} size="small">
                      <Edit />
                    </IconButton>
                    <IconButton 
                      onClick={() => handleDeleteUser(user.id)} 
                      size="small" 
                      color="error"
                      disabled={user.id === user?.id}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* User Add/Edit Dialog */}
      <Dialog open={openUserDialog} onClose={handleCloseUserDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            required
            disabled={!!editingUser}
            sx={{ mb: 2 }}
          />
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="role-select-label">Role</InputLabel>
            <Select
              labelId="role-select-label"
              value={userRole}
              label="Role"
              onChange={(e) => setUserRole(e.target.value as UserRole)}
            >
              <MenuItem value={UserRole.ADMIN}>Admin</MenuItem>
              <MenuItem value={UserRole.USER}>Standard User</MenuItem>
            </Select>
          </FormControl>

          {!editingUser && (
            <>
              <FormControlLabel
                control={
                  <Switch
                    checked={generatePassword}
                    onChange={(e) => setGeneratePassword(e.target.checked)}
                  />
                }
                label="Generate random password"
                sx={{ mb: 2 }}
              />

              {!generatePassword && (
                <TextField
                  margin="dense"
                  label="Password"
                  type="password"
                  fullWidth
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  required={!generatePassword}
                />
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUserDialog}>Cancel</Button>
          <Button onClick={handleSaveUser} variant="contained" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default UserManagement;