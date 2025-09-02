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
  FormControlLabel,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import { Add, Delete, Edit, AdminPanelSettings } from '@mui/icons-material';
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
    setError(null);
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
    if (!userEmail.trim()) {
      setError('Email is required');
      return;
    }

    let finalPassword = userPassword;
    if (!editingUser && generatePassword) {
      finalPassword = generateRandomPassword();
    }

    if (!editingUser && !finalPassword) {
      setError('Password is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (editingUser) {
        // Update existing user role
        const { error } = await supabase
          .from('profiles')
          .update({ role: userRole })
          .eq('id', editingUser.id);

        if (error) {
          throw error;
        }

        setSuccess('User updated successfully!');
      } else {
        // Create new user
        const { data, error } = await supabase.auth.admin.createUser({
          email: userEmail,
          password: finalPassword,
          email_confirm: true,
          user_metadata: {
            role: userRole
          }
        });

        if (error) {
          throw error;
        }

        setSuccess(`User created successfully! ${generatePassword ? `Password: ${finalPassword}` : ''}`);
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

    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      
      // Delete user from auth
      const { error } = await supabase.auth.admin.deleteUser(id);

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
      <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
        <Alert severity="error">
          You do not have permission to access this page. Admin privileges required.
        </Alert>
      </Paper>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <AdminPanelSettings sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          User Management
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ borderRadius: 2 }}>
            <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  System Users
                </Typography>
                <Button 
                  variant="contained" 
                  startIcon={<Add />} 
                  onClick={openAddUserDialog}
                  sx={{ borderRadius: 2 }}
                >
                  Add User
                </Button>
              </Box>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : users.length === 0 ? (
              <Box sx={{ textAlign: 'center', p: 4 }}>
                <Person sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  No users found
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Create your first user to get started
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Created At</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((userItem) => (
                      <TableRow key={userItem.id} hover>
                        <TableCell>{userItem.email}</TableCell>
                        <TableCell>
                          <Chip
                            label={userItem.role.toUpperCase()}
                            color={userItem.role === 'admin' ? 'primary' : 'default'}
                            size="small"
                            sx={{ borderRadius: 1, fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell>{new Date(userItem.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <IconButton 
                            onClick={() => openEditUserDialog(userItem)} 
                            size="small"
                            sx={{ mr: 1 }}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton 
                            onClick={() => handleDeleteUser(userItem.id)} 
                            size="small" 
                            color="error"
                            disabled={userItem.id === user?.id}
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
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                User Statistics
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Total Users
                </Typography>
                <Typography variant="h4" color="primary.main">
                  {users.length}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Administrators
                </Typography>
                <Typography variant="h4" color="secondary.main">
                  {users.filter(u => u.role === 'admin').length}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">
                  Standard Users
                </Typography>
                <Typography variant="h4" color="success.main">
                  {users.filter(u => u.role === 'user').length}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* User Add/Edit Dialog */}
      <Dialog open={openUserDialog} onClose={handleCloseUserDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>
          {editingUser ? 'Edit User' : 'Add New User'}
        </DialogTitle>
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
              <MenuItem value={UserRole.USER}>Standard User</MenuItem>
              <MenuItem value={UserRole.ADMIN}>Administrator</MenuItem>
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
                  helperText="Minimum 6 characters"
                />
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseUserDialog} sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveUser} 
            variant="contained" 
            disabled={loading}
            sx={{ borderRadius: 2 }}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;