"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Key, 
  Bot, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  Copy, 
  Plus, 
  Trash2, 
  Edit, 
  Activity,
  Users,
  MessageCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface ApiToken {
  id: string;
  name: string;
  type: string;
  serverId?: string;
  channelIds?: string[];
  isActive: boolean;
  lastUsed?: string;
  usageCount: number;
  rateLimit: number;
  expiresAt?: string;
  createdAt: string;
}

interface Agent {
  id: string;
  name: string;
  email: string;
  agentType: string;
  displayName: string;
  description?: string;
  capabilities: {
    canImpersonate: boolean;
    canCreateUsers: boolean;
    systemBot: boolean;
  };
  activity: {
    isOnline: boolean;
    lastActive?: string;
    messageCount: number;
  };
  createdAt: string;
}

interface VisitorSession {
  id: string;
  sessionId: string;
  email?: string;
  name?: string;
  origin: string;
  channelId?: string;
  pageViews: number;
  messagesCount: number;
  isActive: boolean;
  lastActivity: string;
  createdAt: string;
}

export function ExternalIntegrationsPanel() {
  const { toast } = useToast();
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [visitorSessions, setVisitorSessions] = useState<VisitorSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedToken, setSelectedToken] = useState<ApiToken | null>(null);
  const [showTokenValue, setShowTokenValue] = useState<string | null>(null);
  const [createTokenDialog, setCreateTokenDialog] = useState(false);
  const [createAgentDialog, setCreateAgentDialog] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tokensRes, agentsRes, sessionsRes] = await Promise.all([
        fetch('/api/external/tokens'),
        fetch('/api/external/agents'),
        fetch('/api/external/visitor-activity?active=true')
      ]);

      if (tokensRes.ok) {
        const tokensData = await tokensRes.json();
        setTokens(tokensData.tokens || []);
      }

      if (agentsRes.ok) {
        const agentsData = await agentsRes.json();
        setAgents(agentsData.agents || []);
      }

      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        setVisitorSessions(sessionsData.visitorSessions || []);
      }
    } catch (error) {
      console.error('Failed to load integration data:', error);
      toast({
        title: "Error",
        description: "Failed to load integration data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Success",
      description: "Copied to clipboard",
    });
  };

  const toggleTokenVisibility = (tokenId: string) => {
    setShowTokenValue(showTokenValue === tokenId ? null : tokenId);
  };

  const deleteToken = async (tokenId: string) => {
    try {
      const response = await fetch(`/api/external/tokens?tokenId=${tokenId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setTokens(prev => prev.filter(t => t.id !== tokenId));
        toast({
          title: "Success",
          description: "Token deleted successfully",
        });
      } else {
        throw new Error('Failed to delete token');
      }
    } catch (error) {
      console.error('Error deleting token:', error);
      toast({
        title: "Error",
        description: "Failed to delete token",
        variant: "destructive",
      });
    }
  };

  const toggleTokenStatus = async (tokenId: string, isActive: boolean) => {
    try {
      const response = await fetch('/api/external/tokens', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId, isActive: !isActive })
      });

      if (response.ok) {
        setTokens(prev => prev.map(t => 
          t.id === tokenId ? { ...t, isActive: !isActive } : t
        ));
        toast({
          title: "Success",
          description: `Token ${!isActive ? 'activated' : 'deactivated'}`,
        });
      } else {
        throw new Error('Failed to update token');
      }
    } catch (error) {
      console.error('Error updating token:', error);
      toast({
        title: "Error",
        description: "Failed to update token",
        variant: "destructive",
      });
    }
  };

  const getTokenTypeColor = (type: string) => {
    switch (type) {
      case 'SERVICE_ACCOUNT': return 'bg-blue-100 text-blue-800';
      case 'WEBHOOK_INTEGRATION': return 'bg-green-100 text-green-800';
      case 'WIDGET_EMBED': return 'bg-purple-100 text-purple-800';
      case 'AGENT_BOT': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAgentTypeColor = (type: string) => {
    switch (type) {
      case 'AI_ASSISTANT': return 'bg-blue-100 text-blue-800';
      case 'VAPI_TRANSCRIBER': return 'bg-green-100 text-green-800';
      case 'SYSTEM_NOTIFIER': return 'bg-red-100 text-red-800';
      case 'PORTFOLIO_VISITOR': return 'bg-gray-100 text-gray-800';
      case 'WORKFLOW_RESPONDER': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">External Integrations</h1>
          <p className="text-gray-600">Manage API tokens, agents, and external connections</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setCreateTokenDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Token
          </Button>
          <Button variant="outline" onClick={() => setCreateAgentDialog(true)}>
            <Bot className="w-4 h-4 mr-2" />
            New Agent
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tokens</CardTitle>
                            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tokens.filter(t => t.isActive).length}</div>
            <p className="text-xs text-muted-foreground">
              {tokens.length} total tokens
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agents.filter(a => a.activity.isOnline).length}</div>
            <p className="text-xs text-muted-foreground">
              {agents.length} total agents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{visitorSessions.filter(s => s.isActive).length}</div>
            <p className="text-xs text-muted-foreground">
              {visitorSessions.length} total sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {visitorSessions.reduce((sum, s) => sum + s.messagesCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              From external sources
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="tokens" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tokens">API Tokens</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="visitors">Visitor Sessions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="tokens" className="space-y-4">
          <div className="grid gap-4">
            {tokens.map((token) => (
              <Card key={token.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CardTitle className="text-lg">{token.name}</CardTitle>
                      <Badge className={getTokenTypeColor(token.type)}>
                        {token.type.replace('_', ' ')}
                      </Badge>
                      <Badge variant={token.isActive ? "default" : "secondary"}>
                        {token.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleTokenStatus(token.id, token.isActive)}
                      >
                        {token.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => deleteToken(token.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    Usage: {token.usageCount} requests | Rate limit: {token.rateLimit}/hour
                    {token.lastUsed && ` | Last used: ${new Date(token.lastUsed).toLocaleDateString()}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Label>Token:</Label>
                      <div className="flex items-center space-x-2 flex-1">
                        <Input
                          value={showTokenValue === token.id ? `disc_${token.id}...` : '•'.repeat(20)}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleTokenVisibility(token.id)}
                        >
                          {showTokenValue === token.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(`disc_${token.id}...`)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {token.channelIds && token.channelIds.length > 0 && (
                      <div>
                        <Label>Allowed Channels:</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {token.channelIds.map(channelId => (
                            <Badge key={channelId} variant="outline">
                              {channelId}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <div className="grid gap-4">
            {agents.map((agent) => (
              <Card key={agent.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CardTitle className="text-lg">{agent.displayName}</CardTitle>
                      <Badge className={getAgentTypeColor(agent.agentType)}>
                        {agent.agentType.replace('_', ' ')}
                      </Badge>
                      <Badge variant={agent.activity.isOnline ? "default" : "secondary"}>
                        {agent.activity.isOnline ? 'Online' : 'Offline'}
                      </Badge>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    {agent.description || 'No description provided'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <Label>Email</Label>
                      <p className="font-mono">{agent.email}</p>
                    </div>
                    <div>
                      <Label>Messages Sent</Label>
                      <p>{agent.activity.messageCount}</p>
                    </div>
                    <div>
                      <Label>Last Active</Label>
                      <p>{agent.activity.lastActive ? new Date(agent.activity.lastActive).toLocaleDateString() : 'Never'}</p>
                    </div>
                    <div>
                      <Label>Capabilities</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {agent.capabilities.canImpersonate && (
                          <Badge variant="outline" className="text-xs">Impersonate</Badge>
                        )}
                        {agent.capabilities.systemBot && (
                          <Badge variant="outline" className="text-xs">System</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="visitors" className="space-y-4">
          <div className="grid gap-4">
            {visitorSessions.map((session) => (
              <Card key={session.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CardTitle className="text-lg">
                        {session.name || session.email || 'Anonymous Visitor'}
                      </CardTitle>
                      <Badge variant={session.isActive ? "default" : "secondary"}>
                        {session.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500">
                      Session: {session.sessionId}
                    </div>
                  </div>
                  <CardDescription>
                    From: {session.origin} | Channel: {session.channelId || 'None'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <Label>Page Views</Label>
                      <p>{session.pageViews}</p>
                    </div>
                    <div>
                      <Label>Messages</Label>
                      <p>{session.messagesCount}</p>
                    </div>
                    <div>
                      <Label>Last Activity</Label>
                      <p>{new Date(session.lastActivity).toLocaleString()}</p>
                    </div>
                    <div>
                      <Label>Created</Label>
                      <p>{new Date(session.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Token Usage</CardTitle>
                <CardDescription>API requests over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Token usage analytics coming soon...
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Visitor Activity</CardTitle>
                <CardDescription>Chat widget engagement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Visitor analytics coming soon...
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 