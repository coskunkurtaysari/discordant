import { db } from "@/lib/db";
import { Member, Message, Profile } from "@prisma/client";
import { randomUUID } from "crypto";
import { getAIResponse } from "./ai-interface";
import { WorkflowRouter, WorkflowRoute, WorkflowPayload } from "./workflow-router";
import { CalendarCommandDetector } from "@/lib/utils/calendar-command-detector";
import OpenAI from "openai";
import { getWorkflowProxyUrl } from "@/lib/utils/server-config";

const SYSTEM_USER_ID = process.env.SYSTEM_USER_ID || "system-user-9000";

// Initialize OpenAI client for fallback
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface MessageWithMember extends Message {
  member: {
    profile: Profile;
  };
  asIs?: boolean;
  type?: string; // for extensibility
}

export interface HandlerContext {
  channelId: string;
  serverId?: string;
  context: any;
  req?: any;
}

export type SystemMessageResult = any;

export interface SystemMessageHandler {
  canHandle(message: MessageWithMember): boolean;
  handle(message: MessageWithMember, ctx: HandlerContext): Promise<SystemMessageResult>;
}

async function fetchSystemMember(channelId: string) {
  console.log(`[FETCH_SYSTEM_MEMBER] Looking for System User in channel: ${channelId}`);
  
  const channel = await db.channel.findUnique({
    where: { id: channelId },
    select: { serverId: true },
  });

  if (!channel) throw new Error("Channel not found");

  console.log(`[FETCH_SYSTEM_MEMBER] Channel found, server ID: ${channel.serverId}`);

  const systemUser = await db.profile.findUnique({
    where: { id: SYSTEM_USER_ID },
  });

  if (!systemUser) {
    console.error(`[FETCH_SYSTEM_MEMBER] System user profile not found: ${SYSTEM_USER_ID}`);
    throw new Error("System user not found");
  }

  console.log(`[FETCH_SYSTEM_MEMBER] System user profile found: ${systemUser.name}`);

  const member = await db.member.findFirst({
    where: {
      profileId: SYSTEM_USER_ID,
      serverId: channel.serverId,
    },
  });

  if (!member) {
    console.log(`[FETCH_SYSTEM_MEMBER] System member not found, creating new member`);
    const newMember = await db.member.create({
      data: {
        id: randomUUID(),
        profileId: SYSTEM_USER_ID,
        serverId: channel.serverId,
        role: "GUEST",
      },
    });
    console.log(`[FETCH_SYSTEM_MEMBER] Created new system member: ${newMember.id}`);
    return newMember;
  }

  console.log(`[FETCH_SYSTEM_MEMBER] Found existing system member: ${member.id}`);
  return member;
}

async function getSystemContext(channelId: string) {
  try {
    // Get active users and channels - this query is safe as it doesn't include member relationships
    const activeChannels = await db.channel.findMany({
      where: {
        messages: {
          some: {
            createdAt: {
              gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // Last 48 hours
            },
          },
        },
      },
      include: {
        _count: {
          select: { messages: true },
        },
      },
      take: 50,
    });

    // Use raw SQL to get recent messages with safe null handling for member relationships
    const recentMessagesRaw = await db.$queryRaw`
      SELECT 
        m.id,
        m.content,
        m.createdAt,
        m.role,
        COALESCE(p.name, 'Unknown User') as authorName
      FROM message m
      LEFT JOIN member mb ON m.memberId = mb.id
      LEFT JOIN profile p ON mb.profileId = p.id
      WHERE m.channelId = ${channelId}
      AND m.createdAt >= ${new Date(Date.now() - 1000 * 60 * 60 * 24)}
      ORDER BY m.createdAt DESC
      LIMIT 50
    `;

    // Process the raw query results with null safety
    const processedRecentMessages = (recentMessagesRaw as any[]).map(msg => ({
      content: String(msg.content || ''),
      author: String(msg.authorName || 'Unknown User'),
      timestamp: msg.createdAt instanceof Date ? msg.createdAt : new Date(msg.createdAt),
      role: String(msg.role || 'user'),
    }));

    // Get unique online users safely
    const onlineUsers = [...new Set(
      processedRecentMessages
        .map(m => m.author)
        .filter(author => author && author !== 'Unknown User')
    )];

    return {
      systemState: {
        platform: "Multi-Workspace, Multi-Channel Chat Platform",
        timestamp: new Date().toISOString(),
      },
      channelContext: {
        activeChannels: activeChannels.map((c) => ({
          name: c.name || 'Unknown Channel',
          messageCount: c._count?.messages || 0,
        })),
      },
      userContext: {
        onlineUsers: onlineUsers.length > 0 ? onlineUsers : ['Kenneth Courtney'],
      },
      recentMessages: processedRecentMessages,
    };
  } catch (error) {
    console.error("[GET_SYSTEM_CONTEXT] Error:", {
      error: error instanceof Error ? error.message : 'Unknown error',
      channelId,
      timestamp: new Date().toISOString()
    });

    // Return safe fallback context
    return {
      systemState: {
        platform: "Multi-Workspace, Multi-Channel Chat Platform",
        timestamp: new Date().toISOString(),
      },
      channelContext: {
        activeChannels: [{ name: 'general', messageCount: 0 }],
      },
      userContext: {
        onlineUsers: ['Kenneth Courtney'],
      },
      recentMessages: [],
    };
  }
}

// Enhanced Site AI Orchestrator - coordinates with n8n and provides intelligent formatting
async function getSiteAIResponse(
  message: MessageWithMember, 
  context: any, 
  channelId: string,
  workflowRoute?: WorkflowRoute,
  workflowError?: string
): Promise<string> {
  try {
    console.log(`[SITE_AI_ORCHESTRATOR] Processing message: ${message.content.substring(0, 100)}`);
    
    // Get recent conversation history for context using safe raw SQL
    const conversationHistoryRaw = await db.$queryRaw`
      SELECT 
        m.content,
        m.createdAt,
        COALESCE(p.name, 'Unknown User') as authorName
      FROM message m
      LEFT JOIN member mb ON m.memberId = mb.id
      LEFT JOIN profile p ON mb.profileId = p.id
      WHERE m.channelId = ${channelId}
      AND m.createdAt >= ${new Date(Date.now() - 1000 * 60 * 60 * 2)}
      ORDER BY m.createdAt DESC
      LIMIT 20
    `;

    // Format conversation history safely
    const conversationHistory = (conversationHistoryRaw as any[]).map(msg => ({
      content: String(msg.content || ''),
      author: String(msg.authorName || 'Unknown User'),
      createdAt: msg.createdAt instanceof Date ? msg.createdAt : new Date(msg.createdAt)
    }));

    const historyText = conversationHistory
      .reverse()
      .map(msg => `${msg.author}: ${msg.content}`)
      .join('\n');

    // Determine if this was a workflow failure or direct site AI request
    const workflowFailed = workflowError || workflowRoute;
    const currentTime = new Date();
    const timeString = currentTime.toLocaleTimeString('en-US', { timeZone: 'America/New_York' });
    const dateString = currentTime.toISOString().split('T')[0];

    // Enhanced system prompt for Site AI Orchestrator
    const systemPrompt = `You are Kenneth's Enhanced Site AI Orchestrator for Discordant at discordant.kendev.co.

🎯 **Your Role**: Chief Intelligence Officer for National Registration Group
⏰ **Current Context**:
- Date: ${dateString}
- Time: ${timeString} Eastern
- Channel: ${context.channelContext?.activeChannels?.[0]?.name || 'general'}
- Online Users: ${context.userContext?.onlineUsers?.join(', ') || 'Kenneth Courtney'}

🛠️ **Available Capabilities**:
${workflowFailed ? `
🔄 **System Status**: Advanced n8n workflow temporarily unavailable
- Primary AI tools experiencing ${workflowError ? 'connectivity issues' : 'processing delays'}
- Operating in Site AI mode with full business intelligence capabilities
- Can still provide comprehensive analysis and recommendations
` : `
✅ **System Status**: All systems operational
- Full access to calendar management tools
- Message search and conversation analysis
- Real-time web research capabilities
- Business intelligence and strategic analysis
`}

📅 **Calendar Management**: Schedule, view, and manage meetings
🔍 **Message Search**: Find conversations and business discussions  
🌐 **Business Intelligence**: Market research and strategic analysis
💼 **Executive Support**: Data-driven recommendations and insights

🎯 **Response Guidelines**:
- Provide strategic business insights suitable for executive decision-making
- Be conversational and engaging with appropriate humor when requested
- Use professional formatting with clear action items
- Include relevant timestamps and context
- Format responses as proper system messages

${workflowFailed ? `
🔧 **Recovery Mode**: 
- Acknowledge any system limitations honestly
- Provide maximum value with available resources
- Suggest alternatives when primary tools unavailable
` : ''}

📊 **Recent Conversation Context**:
${historyText}

Remember: You serve as Kenneth's intelligent business assistant. Provide clear, actionable insights with professional presentation.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message.content }
      ],
      temperature: 0.3,
      max_tokens: 2000,
      stream: false,
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error("No response received from Site AI");
    }

    // Format as system message with timestamp and status
    let formattedResponse = response;
    
    if (workflowFailed) {
      formattedResponse += `\n\n---\n🔄 **System Status**: Response generated by Site AI Orchestrator\n⏱️ **Response Time**: ${timeString}\n${workflowError ? `📊 **Note**: Advanced workflow tools temporarily unavailable - ${workflowError}` : ''}`;
    } else {
      formattedResponse += `\n\n---\n✅ **System Status**: Full capabilities operational\n⏱️ **Response Time**: ${timeString}`;
    }

    console.log(`[SITE_AI_ORCHESTRATOR] Generated response: ${formattedResponse.substring(0, 200)}...`);
    return formattedResponse;

  } catch (error) {
    console.error(`[SITE_AI_ORCHESTRATOR] Error:`, error);
    
    const currentTime = new Date();
    const timeString = currentTime.toLocaleTimeString('en-US', { timeZone: 'America/New_York' });
    
    return `🚨 **Site AI Orchestrator Alert**

I'm experiencing technical difficulties processing your request at this time.

**Your Message**: "${message.content}"
**Error Time**: ${timeString}
**Error Details**: ${error instanceof Error ? error.message : 'Unknown error'}

**Immediate Actions**:
1. **Retry** your request in 30 seconds
2. **Contact** system administrator if issue persists
3. **Alternative**: Use the chat test interface at /test-ai

**Status**: Both primary workflow and Site AI systems experiencing issues
**Expected Resolution**: Typically resolves within 2-3 minutes

---
🔧 **System ID**: Site-AI-Orchestrator
⏱️ **Error Time**: ${timeString}`;
  }
}

// --- Handlers ---

class OnboardingHandler implements SystemMessageHandler {
  canHandle(message: MessageWithMember) {
    return message.asIs === true;
  }
  async handle(message: MessageWithMember, { channelId }: HandlerContext) {
    // asIs logic
    const systemMember = await fetchSystemMember(message.channelId);
    const systemMessage = await db.message.create({
      data: {
        id: randomUUID(),
        content: message.content,
        channelId,
        memberId: systemMember.id,
        role: "system",
        updatedAt: new Date(),
      },
      include: {
        member: { include: { profile: true } },
      },
    });
    return systemMessage;
  }
}

// Enhanced Workflow Handler with dual-mode processing (sync/async)
class WorkflowHandler implements SystemMessageHandler {
  canHandle(message: MessageWithMember) {
    // Handle all messages except onboarding
    return !message.asIs;
  }

  async handle(message: MessageWithMember, { channelId, serverId, context, req }: HandlerContext) {
    // Determine which workflow should handle this message
    const hasFileUrl = !!message.fileUrl;
    const route = WorkflowRouter.getWorkflowRoute(message.content, hasFileUrl);
    
    console.log(`[WORKFLOW_HANDLER] === PROCESSING MODE DEBUG ===`);
    console.log(`[WORKFLOW_HANDLER] Message: "${message.content}"`);
    console.log(`[WORKFLOW_HANDLER] Has File: ${hasFileUrl}`);
    console.log(`[WORKFLOW_HANDLER] File URL: ${message.fileUrl || 'none'}`);
    console.log(`[WORKFLOW_HANDLER] Intent: ${route.workflowId}`);
    console.log(`[WORKFLOW_HANDLER] Processing Mode: ${route.mode}`);
    console.log(`[WORKFLOW_HANDLER] Channel ID: ${channelId}`);
    console.log(`[WORKFLOW_HANDLER] Server ID: ${serverId}`);

    // Route to appropriate processing mode
    if (route.mode === "sync") {
      return await this.handleSynchronousChat(message, { channelId, serverId, context, req }, route);
    } else {
      return await this.handleAsynchronousWorkflow(message, { channelId, serverId, context, req }, route);
    }
  }

  /**
   * Handle simple conversational AI with immediate response
   */
  private async handleSynchronousChat(
    message: MessageWithMember, 
    { channelId, serverId, context, req }: HandlerContext,
    route: WorkflowRoute
  ) {
    console.log(`[WORKFLOW_HANDLER] 🚀 Starting synchronous chat processing`);
    
    try {
      // Get immediate AI response using OpenAI
      const aiResponse = await getSiteAIResponse(message, context, channelId, route);
      
      // Create AI response message directly
      const systemMember = await fetchSystemMember(channelId);
      const responseMessage = await db.message.create({
        data: {
          id: randomUUID(),
          content: aiResponse,
          channelId,
          memberId: systemMember.id,
          role: "system",
          updatedAt: new Date(),
        },
        include: { member: { include: { profile: true } } },
      });

      console.log(`[WORKFLOW_HANDLER] ✅ Synchronous response created: ${responseMessage.id}`);
      return responseMessage;

    } catch (error) {
      console.error(`[WORKFLOW_HANDLER] ❌ Synchronous chat failed:`, error);
      
      // Create error message
      const systemMember = await fetchSystemMember(channelId);
      const errorMessage = await db.message.create({
        data: {
          id: randomUUID(),
          content: `🚨 **Chat System Error**\n\nI'm having trouble processing your message right now. Please try again in a moment.\n\n**Error**: ${error instanceof Error ? error.message : 'Unknown error'}`,
          channelId,
          memberId: systemMember.id,
          role: "system",
          updatedAt: new Date(),
        },
        include: { member: { include: { profile: true } } },
      });

      return errorMessage;
    }
  }

  /**
   * Handle complex workflow processing with async callback
   */
  private async handleAsynchronousWorkflow(
    message: MessageWithMember, 
    { channelId, serverId, context, req }: HandlerContext,
    route: WorkflowRoute
  ) {
    console.log(`[WORKFLOW_HANDLER] 🔄 Starting asynchronous workflow processing`);
    
    // Create initial processing message FIRST
    const systemMember = await fetchSystemMember(channelId);
    const processingMessage = await db.message.create({
      data: {
        id: randomUUID(),
        content: "🤖 **Processing Complex Request...**\n\nI'm working on your request using advanced AI tools. This may take a moment...",
        channelId,
        memberId: systemMember.id,
        role: "system",
        updatedAt: new Date(),
      },
      include: { member: { include: { profile: true } } },
    });

    console.log(`[WORKFLOW_HANDLER] Created processing message: ${processingMessage.id}`);
    console.log(`[WORKFLOW_HANDLER] ✅ Processing message created`);
    // Note: Real-time updates now handled by SSE system

    // Process message based on intent
    let processedMessage = message.content;
    const intent = WorkflowRouter.detectIntent(message.content);
    
    // Add date/time context for calendar-related messages
    if (intent === "calendar") {
      const calendarProcessed = CalendarCommandDetector.processCalendarMessage(message.content);
      processedMessage = calendarProcessed.processedMessage;
      console.log(`[WORKFLOW_HANDLER] Calendar message enhanced with date/time context`);
    }

    // Create the workflow payload WITH the processing messageId
    const payload = WorkflowRouter.createWorkflowPayload(
      { ...message, content: processedMessage },
      route,
      channelId,
      serverId,
      processingMessage.id // Pass the processing message ID for UPDATE
    );

    // Get the webhook URL using dynamic detection
    const proxyUrl = getWorkflowProxyUrl(req);
    
    console.log(`[WORKFLOW_HANDLER] Proxy URL: ${proxyUrl}`);
    console.log(`[WORKFLOW_HANDLER] Payload with messageId:`, JSON.stringify(payload, null, 2));
    
    // First, try the n8n workflow
    try {
      console.log(`[WORKFLOW_HANDLER] Attempting n8n workflow connection...`);
      console.log(`[WORKFLOW_HANDLER] Making fetch request to: ${proxyUrl}`);
      
      const res = await fetch(proxyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Workflow-Id": route.workflowId,
          "X-Webhook-Path": route.webhookPath,
          "User-Agent": "Discordant-Chat-App/1.0",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(60000), // 60 second timeout to match n8n workflow settings
      });

      console.log(`[WORKFLOW_HANDLER] Response status: ${res.status}`);
      console.log(`[WORKFLOW_HANDLER] Response headers:`, Object.fromEntries(res.headers.entries()));

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`[WORKFLOW_HANDLER] HTTP Error Response: ${errorText}`);
        throw new Error(`HTTP ${res.status}: ${res.statusText} - ${errorText}`);
      }

      const workflowResponse = await res.json();
      console.log(`[WORKFLOW_HANDLER] ✅ n8n workflow response received:`, JSON.stringify(workflowResponse, null, 2));

      // If n8n workflow succeeds, return the processing message (it will be updated by n8n)
      return processingMessage;

    } catch (err) {
      console.error(`[WORKFLOW_HANDLER] ❌ n8n workflow failed, attempting OpenAI fallback:`, err);
      console.error(`[WORKFLOW_HANDLER] Error details:`, {
        name: err instanceof Error ? err.name : 'Unknown',
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : 'No stack trace'
      });
      
      // Fallback to OpenAI - UPDATE the processing message
      try {
        const fallbackResponse = await getSiteAIResponse(message, context, channelId, route, err instanceof Error ? err.message : undefined);
        
        // Update the processing message with fallback response
        const updatedMessage = await db.message.update({
          where: { id: processingMessage.id },
          data: {
            content: fallbackResponse,
            updatedAt: new Date(),
          },
          include: { member: { include: { profile: true } } },
        });

        console.log(`[WORKFLOW_HANDLER] ✅ Fallback message updated`);
        // Note: Real-time updates now handled by SSE system

        console.log(`[WORKFLOW_HANDLER] ✅ Site AI fallback successful`);
        return updatedMessage;
        
      } catch (fallbackErr) {
        console.error(`[WORKFLOW_HANDLER] ❌ Site AI fallback also failed:`, fallbackErr);
        
        // Update processing message with error
        const errorMessage = `🚨 **System Status Alert**

Both the primary AI workflow system and the backup Site AI service are currently experiencing difficulties.

**Primary System Error:** ${err instanceof Error ? err.message : 'Connection failed'}
**Backup System Error:** ${fallbackErr instanceof Error ? fallbackErr.message : 'Unknown error'}

**Your message:** "${message.content}"

Please try again in a few minutes, or contact your system administrator if the issue persists.

**Environment:** ${process.env.NODE_ENV}
**Timestamp:** ${new Date().toISOString()}`;

        const errorUpdatedMessage = await db.message.update({
          where: { id: processingMessage.id },
          data: {
            content: errorMessage,
            updatedAt: new Date(),
          },
          include: { member: { include: { profile: true } } },
        });

        console.log(`[WORKFLOW_HANDLER] ✅ Error message updated`);
        // Note: Real-time updates now handled by SSE system

        return errorUpdatedMessage;
      }
    }
  }

  private formatWorkflowResponse(response: any, route: WorkflowRoute, errorType: string | null, usedFallback: boolean = false): string {
    console.log(`[FORMAT_WORKFLOW_RESPONSE] Starting format for workflow: ${route.workflowId}`);
    console.log(`[FORMAT_WORKFLOW_RESPONSE] Error type: ${errorType}`);
    console.log(`[FORMAT_WORKFLOW_RESPONSE] Used fallback: ${usedFallback}`);
    console.log(`[FORMAT_WORKFLOW_RESPONSE] Raw response type:`, typeof response);
    console.log(`[FORMAT_WORKFLOW_RESPONSE] Raw response:`, JSON.stringify(response, null, 2));

    if (errorType === "total_failure") {
      console.log(`[FORMAT_WORKFLOW_RESPONSE] Returning total failure message`);
      return response.message || `⚠️ ${route.description} service experiencing critical difficulties.`;
    }

    // Handle array response from n8n
    let responseData = response;
    if (Array.isArray(response) && response.length > 0) {
      responseData = response[0];
      console.log(`[FORMAT_WORKFLOW_RESPONSE] Using first item from array response`);
    }

    // Extract message from the response data - check multiple possible fields
    let message = responseData?.message || 
                  responseData?.formattedMessage || 
                  responseData?.text || 
                  responseData?.content || 
                  responseData?.output ||
                  responseData?.data?.message ||
                  responseData?.data?.content ||
                  responseData?.data?.output;

    console.log(`[FORMAT_WORKFLOW_RESPONSE] Extracted message from field check:`, message ? message.substring(0, 100) + '...' : 'null');

    // If message is still not found, check if the whole response is a string
    if (!message && typeof responseData === 'string') {
      message = responseData;
      console.log(`[FORMAT_WORKFLOW_RESPONSE] Using entire response as string`);
    }

    // Debug logging to see what we're getting
    console.log(`[WORKFLOW_HANDLER] Raw response:`, JSON.stringify(response, null, 2));
    console.log(`[WORKFLOW_HANDLER] Extracted message:`, message);

    // If no message found, provide helpful debug info
    if (!message || message === "No calendar data available.") {
      console.log(`[WORKFLOW_HANDLER] Response structure:`, {
        isArray: Array.isArray(response),
        responseType: typeof response,
        keys: response ? Object.keys(response) : [],
        dataKeys: responseData ? Object.keys(responseData) : []
      });
      
      // Check if this is a "no data" response from calendar
      if (route.workflowId === "calendar-assistant" && (!message || message === "No calendar data available.")) {
        message = "I couldn't find any calendar events for that time period. Try checking a different date range or creating a new event.";
        console.log(`[FORMAT_WORKFLOW_RESPONSE] Generated calendar fallback message`);
      } else {
        message = `I received your request but couldn't process the response properly. Please check the logs for details.`;
        console.log(`[FORMAT_WORKFLOW_RESPONSE] Generated generic fallback message`);
      }
    }

    console.log(`[FORMAT_WORKFLOW_RESPONSE] Final message length:`, message ? message.length : 0);

    // NOTE: Long messages are now handled by frontend "Show More" component
    // No longer truncating messages here - let the frontend handle display gracefully
    // if (message && typeof message === 'string' && message.length > 2000) {
    //   message = message.substring(0, 1900) + '...\n\n*Response truncated for display*';
    // }

    // Add fallback indicator if used
    if (usedFallback && errorType === "fallback_used") {
      // Don't add extra fallback indicator - Site AI Orchestrator includes its own status footer
      // message = `🔄 ${message}\n\n*Note: Response generated using backup AI system*`;
      console.log(`[FORMAT_WORKFLOW_RESPONSE] Fallback used, Site AI status included`);
    }

    // Return message without military-style prefixes - just clean, professional responses
    const finalMessage = message.trim();
    console.log(`[FORMAT_WORKFLOW_RESPONSE] Returning final message: ${finalMessage.substring(0, 100)}...`);
    return finalMessage;
  }
}

// Legacy handlers for specific use cases (can be removed if all handled by workflows)
class ImageAnalysisHandler implements SystemMessageHandler {
  canHandle(message: MessageWithMember) {
    return !!message.fileUrl?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  }
  async handle(message: MessageWithMember, { channelId }: HandlerContext) {
    // Image analysis functionality would be handled by n8n workflow instead
    // For now, route to WorkflowHandler
    throw new Error("Image analysis should be handled by workflow");
  }
}

export async function createSystemMessage(
  channelId: string,
  message: MessageWithMember,
  req?: any
) {
  try {
    // Validate inputs to prevent errors
    if (!channelId || !message) {
      console.error("[CREATE_SYSTEM_MESSAGE] Invalid inputs:", { channelId: !!channelId, message: !!message });
      return null;
    }

    console.log(`[CREATE_SYSTEM_MESSAGE] Starting for channel: ${channelId}, message: ${message.id}`);
    
    const context = await getSystemContext(channelId);
    
    // Get serverId for workflow routing with error handling
    const channel = await db.channel.findUnique({
      where: { id: channelId },
      select: { serverId: true },
    });

    if (!channel) {
      console.error("[CREATE_SYSTEM_MESSAGE] Channel not found:", channelId);
      return null;
    }

    const handlers = [
      new OnboardingHandler(),
      new WorkflowHandler(), // This now handles all non-onboarding messages including voice commands via n8n
      new ImageAnalysisHandler(),
    ];

    for (const handler of handlers) {
      try {
        if (handler.canHandle(message)) {
          console.log(`[CREATE_SYSTEM_MESSAGE] Using handler: ${handler.constructor.name}`);
          
          const result = await handler.handle(message, { 
            channelId, 
            serverId: channel.serverId,
            context,
            req 
          });
          
          console.log(`[CREATE_SYSTEM_MESSAGE] Handler completed successfully`);
          return result;
        }
      } catch (handlerError) {
        console.error(`[CREATE_SYSTEM_MESSAGE] Handler error (${handler.constructor.name}):`, {
          error: handlerError instanceof Error ? handlerError.message : 'Unknown error',
          stack: handlerError instanceof Error ? handlerError.stack : undefined,
          channelId,
          messageId: message.id
        });
        
        // Continue to next handler instead of failing completely
        continue;
      }
    }

    console.log(`[CREATE_SYSTEM_MESSAGE] No suitable handler found for message`);
    return null;
    
  } catch (error) {
    console.error("[CREATE_SYSTEM_MESSAGE] Critical error:", {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      channelId,
      messageId: message?.id,
      timestamp: new Date().toISOString()
    });
    
    // Return null instead of throwing to prevent unhandled promise rejections
    return null;
  }
}
