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
  Alert
} from '@mui/material';
import { Send } from '@mui/icons-material';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

const MessagingInterface: React.FC = () => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [channels, setChannels] = useState<string[]>(['email', 'whatsapp']);
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
      // In a real application, this would call a serverless function to send messages
      // For now, we'll just simulate sending by storing in the database
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

      setSuccess('Message sent successfully!');
      setMessage('');
      setSelectedContacts([]);
      setSelectedChannels([]);
    } catch (error: any) {
      setError(`Failed to send message: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Compose Message
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth sx={{ mb: 2 }}>
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
                  return <Chip key={value} label={contact?.name || value} />;
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

        <FormControl fullWidth sx={{ mb: 2 }}>
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
                  <Chip key={value} label={value.toUpperCase()} />
                ))}
              </Box>
            )}
            MenuProps={MenuProps}
          >
            {channels.map((channel) => (
              <MenuItem key={channel} value={channel}>
                <Checkbox checked={selectedChannels.indexOf(channel) > -1} />
                <ListItemText primary={channel.toUpperCase()} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          multiline
          rows={4}
          label="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          sx={{ mb: 2 }}
        />

        <Button
          variant="contained"
          color="primary"
          endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Send />}
          onClick={handleSendMessage}
          disabled={loading}
          fullWidth
        >
          {loading ? 'Sending...' : 'Send Message'}
        </Button>
      </Box>
    </Paper>
  );
};

export default MessagingInterface;