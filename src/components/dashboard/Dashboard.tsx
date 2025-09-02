import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  CardHeader,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress
} from '@mui/material';
import { Email, WhatsApp, Contacts, Person } from '@mui/icons-material';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState({
    totalContacts: 0,
    totalMessages: 0,
    emailsSent: 0,
    whatsappSent: 0,
    totalUsers: 0
  });
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch contacts count
      const { count: contactsCount, error: contactsError } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true });

      if (contactsError) throw contactsError;

      // Fetch messages stats
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .order('sent_at', { ascending: false });

      if (messagesError) throw messagesError;

      // Calculate message stats
      const emailMessages = messages?.filter(msg => msg.sent_via.includes('email')) || [];
      const whatsappMessages = messages?.filter(msg => msg.sent_via.includes('whatsapp')) || [];

      // Fetch users count (admin only)
      let usersCount = 0;
      if (isAdmin()) {
        const { count, error: usersError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        
        if (usersError) throw usersError;
        usersCount = count || 0;
      }

      setStats({
        totalContacts: contactsCount || 0,
        totalMessages: messages?.length || 0,
        emailsSent: emailMessages.length,
        whatsappSent: whatsappMessages.length,
        totalUsers: usersCount
      });

      setRecentMessages(messages?.slice(0, 5) || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Dashboard</Typography>
      
      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3} component="div">
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Contacts sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4">{stats.totalContacts}</Typography>
              <Typography variant="body1" color="textSecondary">Total Contacts</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3} component="div">
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Email sx={{ fontSize: 48, color: 'info.main', mb: 1 }} />
              <Typography variant="h4">{stats.emailsSent}</Typography>
              <Typography variant="body1" color="textSecondary">Emails Sent</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3} component="div">
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <WhatsApp sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
              <Typography variant="h4">{stats.whatsappSent}</Typography>
              <Typography variant="body1" color="textSecondary">WhatsApp Messages</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {isAdmin() && (
          <Grid item xs={12} sm={6} md={3} component="div">
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Person sx={{ fontSize: 48, color: 'secondary.main', mb: 1 }} />
                <Typography variant="h4">{stats.totalUsers}</Typography>
                <Typography variant="body1" color="textSecondary">Total Users</Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
        
        {/* Recent Messages */}
        <Grid item xs={12} component="div">
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Recent Messages</Typography>
            {recentMessages.length === 0 ? (
              <Typography variant="body1" color="textSecondary" sx={{ p: 2 }}>
                No messages sent yet
              </Typography>
            ) : (
              <List>
                {recentMessages.map((message, index) => (
                  <React.Fragment key={message.id}>
                    <ListItem alignItems="flex-start">
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1">
                              Sent via: {message.sent_via.map((via: string) => via.toUpperCase()).join(', ')}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {new Date(message.sent_at).toLocaleString()}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography
                              component="span"
                              variant="body2"
                              color="text.primary"
                            >
                              To {message.recipients.length} recipient(s)
                            </Typography>
                            {" — " + message.content.substring(0, 100) + (message.content.length > 100 ? '...' : '')}
                          </>
                        }
                      />
                    </ListItem>
                    {index < recentMessages.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;