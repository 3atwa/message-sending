import React, { useState, useEffect, useCallback } from 'react';
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
  Tabs,
  Tab,
  Card,
  CardContent
} from '@mui/material';
import { Add, Delete, Edit, Upload, CloudUpload } from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`contact-tab-${index}`}
      aria-labelledby={`contact-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ContactManagement: React.FC = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  
  // Contact form state
  const [openContactDialog, setOpenContactDialog] = useState(false);
  const [editingContact, setEditingContact] = useState<any | null>(null);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  // Import state
  const [importedContacts, setImportedContacts] = useState<any[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('name');

      if (error) {
        throw error;
      }

      setContacts(data || []);
    } catch (error: any) {
      setError(`Error fetching contacts: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setError(null);
    setSuccess(null);
  };

  // Contact CRUD operations
  const openAddContactDialog = () => {
    setEditingContact(null);
    setContactName('');
    setContactEmail('');
    setContactPhone('');
    setOpenContactDialog(true);
  };

  const openEditContactDialog = (contact: any) => {
    setEditingContact(contact);
    setContactName(contact.name);
    setContactEmail(contact.email || '');
    setContactPhone(contact.phone || '');
    setOpenContactDialog(true);
  };

  const handleCloseContactDialog = () => {
    setOpenContactDialog(false);
    setError(null);
  };

  const handleSaveContact = async () => {
    if (!contactName.trim()) {
      setError('Contact name is required');
      return;
    }

    if (!contactEmail.trim() && !contactPhone.trim()) {
      setError('Either email or phone is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const contactData = {
        name: contactName.trim(),
        email: contactEmail.trim() || null,
        phone: contactPhone.trim() || null,
        created_by: user?.id
      };

      let result;
      if (editingContact) {
        result = await supabase
          .from('contacts')
          .update(contactData)
          .eq('id', editingContact.id);
      } else {
        result = await supabase
          .from('contacts')
          .insert(contactData);
      }

      if (result.error) {
        throw result.error;
      }

      setSuccess(`Contact ${editingContact ? 'updated' : 'added'} successfully!`);
      handleCloseContactDialog();
      fetchContacts();
    } catch (error: any) {
      setError(`Failed to ${editingContact ? 'update' : 'add'} contact: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setSuccess('Contact deleted successfully!');
      fetchContacts();
    } catch (error: any) {
      setError(`Failed to delete contact: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // File import functionality
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setImportError(null);
    setImportLoading(true);
    
    const fileReader = new FileReader();
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    fileReader.onload = async (event) => {
      try {
        const result = event.target?.result;
        let parsedData: any[] = [];

        if (fileExtension === 'csv') {
          Papa.parse(result as string, {
            header: true,
            complete: (results: any) => {
              parsedData = results.data;
              processImportedData(parsedData);
            },
            error: (error: any) => {
              setImportError(`CSV parsing error: ${error.message}`);
              setImportLoading(false);
            }
          });
        } else if (['xlsx', 'xls'].includes(fileExtension || '')) {
          const workbook = XLSX.read(result, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          parsedData = XLSX.utils.sheet_to_json(worksheet);
          processImportedData(parsedData);
        } else if (fileExtension === 'json') {
          parsedData = JSON.parse(result as string);
          processImportedData(parsedData);
        } else if (fileExtension === 'txt') {
          const text = result as string;
          const lines = text.split('\n').filter(line => line.trim());
          const headers = lines[0].split(/[,\t]/).map(h => h.trim());
          
          parsedData = lines.slice(1).map(line => {
            const values = line.split(/[,\t]/);
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = values[index]?.trim() || '';
            });
            return obj;
          });
          processImportedData(parsedData);
        } else {
          setImportError('Unsupported file format. Please use CSV, Excel, JSON, or TXT files.');
          setImportLoading(false);
        }
      } catch (error: any) {
        setImportError(`Error processing file: ${error.message}`);
        setImportLoading(false);
      }
    };

    fileReader.onerror = () => {
      setImportError('Error reading file');
      setImportLoading(false);
    };

    if (fileExtension === 'csv' || fileExtension === 'txt' || fileExtension === 'json') {
      fileReader.readAsText(file);
    } else if (['xlsx', 'xls'].includes(fileExtension || '')) {
      fileReader.readAsBinaryString(file);
    } else {
      setImportError('Unsupported file format. Please use CSV, Excel, JSON, or TXT files.');
      setImportLoading(false);
    }
  }, []);

  const processImportedData = (data: any[]) => {
    try {
      const processedContacts = data.map(item => {
        const name = item.name || item.Name || item.NAME || item.contact || item.Contact || '';
        const email = item.email || item.Email || item.EMAIL || '';
        const phone = item.phone || item.Phone || item.PHONE || item.mobile || item.Mobile || item.whatsapp || item.Whatsapp || '';
        
        return { name, email, phone };
      }).filter(contact => contact.name && (contact.email || contact.phone));

      setImportedContacts(processedContacts);
      setImportLoading(false);
    } catch (error: any) {
      setImportError(`Error processing data: ${error.message}`);
      setImportLoading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/json': ['.json'],
      'text/plain': ['.txt']
    },
    maxFiles: 1
  });

  const handleSaveImportedContacts = async () => {
    if (importedContacts.length === 0) {
      setImportError('No valid contacts to import');
      return;
    }

    try {
      setImportLoading(true);
      
      const contactsWithUser = importedContacts.map(contact => ({
        ...contact,
        created_by: user?.id
      }));

      const { error } = await supabase
        .from('contacts')
        .insert(contactsWithUser);

      if (error) {
        throw error;
      }

      setSuccess(`Successfully imported ${importedContacts.length} contacts!`);
      setImportedContacts([]);
      fetchContacts();
      setTabValue(0);
    } catch (error: any) {
      setImportError(`Failed to import contacts: ${error.message}`);
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>Contact Management</Typography>
        <Button 
          variant="contained" 
          startIcon={<Add />} 
          onClick={openAddContactDialog}
          sx={{ borderRadius: 2 }}
        >
          Add Contact
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

      <Paper elevation={2} sx={{ borderRadius: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="contact management tabs">
            <Tab label="Contacts List" />
            <Tab label="Import Contacts" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : contacts.length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 4 }}>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No contacts found
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Add contacts manually or import them from a file
              </Typography>
              <Button variant="contained" onClick={openAddContactDialog}>
                Add Your First Contact
              </Button>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {contacts.map((contact) => (
                    <TableRow key={contact.id} hover>
                      <TableCell>{contact.name}</TableCell>
                      <TableCell>{contact.email || '-'}</TableCell>
                      <TableCell>{contact.phone || '-'}</TableCell>
                      <TableCell>
                        <IconButton 
                          onClick={() => openEditContactDialog(contact)} 
                          size="small"
                          sx={{ mr: 1 }}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton 
                          onClick={() => handleDeleteContact(contact.id)} 
                          size="small" 
                          color="error"
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
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Import Contacts
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Upload a CSV, Excel, JSON, or TXT file containing contacts. The file should have columns for name, email, and/or phone.
            </Typography>
            
            {importError && <Alert severity="error" sx={{ mb: 3 }}>{importError}</Alert>}
            
            <Card 
              {...getRootProps()} 
              sx={{ 
                p: 4, 
                border: isDragActive ? '2px dashed #1976d2' : '2px dashed #ccc', 
                borderRadius: 2, 
                textAlign: 'center',
                cursor: 'pointer',
                mb: 3,
                backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'action.hover',
                }
              }}
            >
              <input {...getInputProps()} />
              <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {isDragActive ? 'Drop the file here' : 'Drag & drop a file here'}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                or click to select a file
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Supported formats: CSV, Excel (.xlsx, .xls), JSON, TXT
              </Typography>
            </Card>

            {importLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Processing file...</Typography>
              </Box>
            )}

            {importedContacts.length > 0 && (
              <Card sx={{ mt: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Preview: {importedContacts.length} contacts found
                  </Typography>
                  
                  <TableContainer sx={{ maxHeight: 300, mb: 3 }}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {importedContacts.map((contact, index) => (
                          <TableRow key={index}>
                            <TableCell>{contact.name}</TableCell>
                            <TableCell>{contact.email || '-'}</TableCell>
                            <TableCell>{contact.phone || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleSaveImportedContacts}
                      disabled={importLoading}
                      sx={{ borderRadius: 2 }}
                    >
                      {importLoading ? 'Importing...' : 'Import Contacts'}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => setImportedContacts([])}
                      disabled={importLoading}
                      sx={{ borderRadius: 2 }}
                    >
                      Cancel
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Box>
        </TabPanel>
      </Paper>

      {/* Contact Add/Edit Dialog */}
      <Dialog open={openContactDialog} onClose={handleCloseContactDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>
          {editingContact ? 'Edit Contact' : 'Add New Contact'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Phone/WhatsApp"
            fullWidth
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            helperText="Include country code for WhatsApp (e.g., +1234567890)"
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseContactDialog} sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveContact} 
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

export default ContactManagement;