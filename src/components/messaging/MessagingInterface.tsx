import React, { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  OutlinedInput,
  Checkbox,
  ListItemText,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import { Send, Email, WhatsApp } from '@mui/icons-material';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 300,
    },
  },
};

const MessagingInterface: React.FC = () => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [channels] = useState<string[]>(['email', 'whatsapp']);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('name');

      if (error) {
        throw error;
      }

      setContacts(data || []);
    } catch (error: any) {
      console.error('Error fetching contacts:', error.message);
    }
  };

  const handleContactChange = (event: SelectChangeEvent<typeof selectedContacts>) => {
    const {
      target: { value },
    } = event;
    setSelectedContacts(
      typeof value === 'string' ? value.split(',') : value,
    );
  };

  const handleChannelChange = (event: SelectChangeEvent<typeof selectedChannels>) => {
    const {
      target: { value },
    } = event;
    setSelectedChannels(
      typeof value === 'string' ? value.split(',') : value,
    );
  };

  const handleSendMessage = async () => {
    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    if (selectedContacts.length === 0) {
      setError('Please select at least one contact');
      return;
    }

    if (selectedChannels.length === 0) {
      setError('Please select at least one channel (Email or WhatsApp)');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          content: message,
          sent_by: user?.id,
          recipients: selectedContacts,
          sent_via: selectedChannels
        });

      if (error) {
        throw error;
      }

      setSuccess(`Message sent successfully to ${selectedContacts.length} contact(s) via ${selectedChannels.join(', ')}!`);
      setMessage('');
      setSelectedContacts([]);
      setSelectedChannels([]);
    } catch (error: any) {
      setError(`Failed to send message: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Email sx={{ fontSize: 16 }} />;
      case 'whatsapp':
        return <WhatsApp sx={{ fontSize: 16 }} />;
      default:
        return null;
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
        Compose Message
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Message Details
            </Typography>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="contacts-select-label">Recipients</InputLabel>
              <Select
                labelId="contacts-select-label"
                id="contacts-select"
                multiple
                value={selectedContacts}
                onChange={handleContactChange}
                input={<OutlinedInput label="Recipients" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const contact = contacts.find(c => c.id === value);
                      return (
                        <Chip 
                          key={value} 
                          label={contact?.name || value} 
                          size="small"
                          sx={{ borderRadius: 1 }}
                        />
                      );
                    })}
                  </Box>
                )}
                MenuProps={MenuProps}
              >
                {contacts.map((contact) => (
                  <MenuItem key={contact.id} value={contact.id}>
                    <Checkbox checked={selectedContacts.indexOf(contact.id) > -1} />
                    <ListItemText 
                      primary={contact.name} 
                      secondary={contact.email || contact.phone} 
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="channels-select-label">Send via</InputLabel>
              <Select
                labelId="channels-select-label"
                id="channels-select"
                multiple
                value={selectedChannels}
                onChange={handleChannelChange}
                input={<OutlinedInput label="Send via" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip 
                        key={value} 
                        icon={getChannelIcon(value)}
                        label={value.toUpperCase()} 
                        size="small"
                        sx={{ borderRadius: 1 }}
                      />
                    ))}
                  </Box>
                )}
                MenuProps={MenuProps}
              >
                {channels.map((channel) => (
                  <MenuItem key={channel} value={channel}>
                    <Checkbox checked={selectedChannels.indexOf(channel) > -1} />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getChannelIcon(channel)}
                      <ListItemText primary={channel.toUpperCase()} />
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={6}
              label="Message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              sx={{ mb: 3 }}
            />

            <Button
              variant="contained"
              color="primary"
              size="large"
              endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Send />}
              onClick={handleSendMessage}
              disabled={loading}
              fullWidth
              sx={{ 
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                borderRadius: 2
              }}
            >
              {loading ? 'Sending...' : 'Send Message'}
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Quick Stats
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Total Contacts
                </Typography>
                <Typography variant="h4" color="primary.main">
                  {contacts.length}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Selected Recipients
                </Typography>
                <Typography variant="h4" color="secondary.main">
                  {selectedContacts.length}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">
                  Selected Channels
                </Typography>
                <Typography variant="h4" color="success.main">
                  {selectedChannels.length}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {contacts.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              No contacts available. Add some contacts first to start messaging.
            </Alert>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default MessagingInterface;