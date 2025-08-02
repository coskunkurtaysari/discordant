-- CreateTable
CREATE TABLE `profile` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `imageUrl` TEXT NULL,
    `email` VARCHAR(191) NOT NULL,
    `role` ENUM('HOST', 'ADMIN', 'MODERATOR', 'USER') NOT NULL DEFAULT 'USER',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Profile_userId_key`(`userId`),
    INDEX `Profile_role_idx`(`role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `server` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `imageUrl` TEXT NULL,
    `inviteCode` VARCHAR(191) NOT NULL,
    `profileId` VARCHAR(191) NOT NULL,
    `workflowEnabled` BOOLEAN NULL DEFAULT true,
    `selectedWorkflow` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Server_inviteCode_key`(`inviteCode`),
    INDEX `Server_profileId_idx`(`profileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `member` (
    `id` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'MODERATOR', 'GUEST') NOT NULL DEFAULT 'GUEST',
    `profileId` VARCHAR(191) NOT NULL,
    `serverId` VARCHAR(191) NOT NULL,
    `onlineStatus` ENUM('ONLINE', 'AWAY', 'DO_NOT_DISTURB', 'OFFLINE') NOT NULL DEFAULT 'OFFLINE',
    `lastSeen` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `isOnline` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Member_profileId_idx`(`profileId`),
    INDEX `Member_serverId_idx`(`serverId`),
    INDEX `Member_onlineStatus_idx`(`onlineStatus`),
    INDEX `Member_isOnline_idx`(`isOnline`),
    INDEX `Member_lastSeen_idx`(`lastSeen`),
    UNIQUE INDEX `member_serverId_profileId_key`(`serverId`, `profileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `channel` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('TEXT', 'AUDIO', 'VIDEO', 'STUDIO') NOT NULL DEFAULT 'TEXT',
    `profileId` VARCHAR(191) NOT NULL,
    `serverId` VARCHAR(191) NOT NULL,
    `workflowEnabled` BOOLEAN NULL DEFAULT true,
    `selectedWorkflow` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Channel_profileId_idx`(`profileId`),
    INDEX `Channel_serverId_idx`(`serverId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `message` (
    `id` VARCHAR(191) NOT NULL,
    `role` ENUM('user', 'system') NOT NULL,
    `content` TEXT NOT NULL,
    `fileUrl` TEXT NULL,
    `memberId` VARCHAR(191) NOT NULL,
    `channelId` VARCHAR(191) NOT NULL,
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Message_channelId_idx`(`channelId`),
    INDEX `Message_memberId_idx`(`memberId`),
    INDEX `Message_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `conversation` (
    `id` VARCHAR(191) NOT NULL,
    `memberOneId` VARCHAR(191) NOT NULL,
    `memberTwoId` VARCHAR(191) NOT NULL,

    INDEX `Conversation_memberOneId_idx`(`memberOneId`),
    INDEX `Conversation_memberTwoId_idx`(`memberTwoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `directmessage` (
    `id` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `fileUrl` VARCHAR(191) NULL,
    `memberId` VARCHAR(191) NOT NULL,
    `conversationId` VARCHAR(191) NOT NULL,
    `deleted` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DirectMessage_conversationId_idx`(`conversationId`),
    INDEX `DirectMessage_memberId_idx`(`memberId`),
    INDEX `DirectMessage_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_session` (
    `id` VARCHAR(191) NOT NULL,
    `profileId` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `serverId` VARCHAR(191) NULL,
    `channelId` VARCHAR(191) NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastActivity` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `connectedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `disconnectedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_session_sessionId_key`(`sessionId`),
    INDEX `UserSession_profileId_idx`(`profileId`),
    INDEX `UserSession_sessionId_idx`(`sessionId`),
    INDEX `UserSession_isActive_idx`(`isActive`),
    INDEX `UserSession_lastActivity_idx`(`lastActivity`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `server_activity` (
    `id` VARCHAR(191) NOT NULL,
    `serverId` VARCHAR(191) NOT NULL,
    `memberId` VARCHAR(191) NULL,
    `activityType` ENUM('MESSAGE_SENT', 'MESSAGE_DELETED', 'MESSAGE_EDITED', 'CHANNEL_JOINED', 'CHANNEL_LEFT', 'VOICE_JOINED', 'VOICE_LEFT', 'TYPING_STARTED', 'TYPING_STOPPED', 'FILE_UPLOADED', 'MEMBER_JOINED', 'MEMBER_LEFT') NOT NULL,
    `description` TEXT NOT NULL,
    `metadata` TEXT NULL,
    `channelId` VARCHAR(191) NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ServerActivity_serverId_idx`(`serverId`),
    INDEX `ServerActivity_memberId_idx`(`memberId`),
    INDEX `ServerActivity_activityType_idx`(`activityType`),
    INDEX `ServerActivity_timestamp_idx`(`timestamp`),
    INDEX `ServerActivity_channelId_idx`(`channelId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `channel_activity` (
    `id` VARCHAR(191) NOT NULL,
    `channelId` VARCHAR(191) NOT NULL,
    `memberId` VARCHAR(191) NULL,
    `activityType` ENUM('MESSAGE_SENT', 'MESSAGE_DELETED', 'MESSAGE_EDITED', 'CHANNEL_JOINED', 'CHANNEL_LEFT', 'VOICE_JOINED', 'VOICE_LEFT', 'TYPING_STARTED', 'TYPING_STOPPED', 'FILE_UPLOADED', 'MEMBER_JOINED', 'MEMBER_LEFT') NOT NULL,
    `description` TEXT NOT NULL,
    `metadata` TEXT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ChannelActivity_channelId_idx`(`channelId`),
    INDEX `ChannelActivity_memberId_idx`(`memberId`),
    INDEX `ChannelActivity_activityType_idx`(`activityType`),
    INDEX `ChannelActivity_timestamp_idx`(`timestamp`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `member_activity` (
    `id` VARCHAR(191) NOT NULL,
    `memberId` VARCHAR(191) NOT NULL,
    `activityType` ENUM('MESSAGE_SENT', 'MESSAGE_DELETED', 'MESSAGE_EDITED', 'CHANNEL_JOINED', 'CHANNEL_LEFT', 'VOICE_JOINED', 'VOICE_LEFT', 'TYPING_STARTED', 'TYPING_STOPPED', 'FILE_UPLOADED', 'MEMBER_JOINED', 'MEMBER_LEFT') NOT NULL,
    `description` TEXT NOT NULL,
    `metadata` TEXT NULL,
    `serverId` VARCHAR(191) NULL,
    `channelId` VARCHAR(191) NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `MemberActivity_memberId_idx`(`memberId`),
    INDEX `MemberActivity_activityType_idx`(`activityType`),
    INDEX `MemberActivity_timestamp_idx`(`timestamp`),
    INDEX `MemberActivity_serverId_idx`(`serverId`),
    INDEX `MemberActivity_channelId_idx`(`channelId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `file_metadata` (
    `id` VARCHAR(191) NOT NULL,
    `messageId` VARCHAR(191) NULL,
    `directMessageId` VARCHAR(191) NULL,
    `originalUrl` TEXT NOT NULL,
    `fileName` TEXT NULL,
    `fileSize` INTEGER NULL,
    `mimeType` VARCHAR(191) NULL,
    `fileType` ENUM('IMAGE', 'PDF', 'VIDEO', 'AUDIO', 'DOCUMENT', 'OTHER') NOT NULL,
    `extractedText` LONGTEXT NULL,
    `description` TEXT NULL,
    `tags` TEXT NULL,
    `location` TEXT NULL,
    `businessContext` TEXT NULL,
    `externalLinks` TEXT NULL,
    `googleDocsUrl` TEXT NULL,
    `sharePointUrl` TEXT NULL,
    `confluenceUrl` TEXT NULL,
    `processingStatus` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'ENHANCED') NOT NULL DEFAULT 'PENDING',
    `ocrCompleted` BOOLEAN NOT NULL DEFAULT false,
    `aiAnalyzed` BOOLEAN NOT NULL DEFAULT false,
    `lastProcessed` DATETIME(3) NULL,
    `aiSummary` TEXT NULL,
    `aiCategories` TEXT NULL,
    `businessEntities` TEXT NULL,
    `actionItems` TEXT NULL,
    `workflowTriggered` BOOLEAN NOT NULL DEFAULT false,
    `workflowResults` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `file_metadata_messageId_key`(`messageId`),
    UNIQUE INDEX `file_metadata_directMessageId_key`(`directMessageId`),
    INDEX `FileMetadata_fileType_idx`(`fileType`),
    INDEX `FileMetadata_processingStatus_idx`(`processingStatus`),
    INDEX `FileMetadata_createdAt_idx`(`createdAt`),
    INDEX `FileMetadata_lastProcessed_idx`(`lastProcessed`),
    INDEX `FileMetadata_messageId_idx`(`messageId`),
    INDEX `FileMetadata_directMessageId_idx`(`directMessageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shared_message` (
    `id` VARCHAR(191) NOT NULL,
    `shareId` VARCHAR(191) NOT NULL,
    `messageId` VARCHAR(191) NULL,
    `directMessageId` VARCHAR(191) NULL,
    `title` TEXT NOT NULL,
    `description` TEXT NULL,
    `category` ENUM('RESEARCH_REPORT', 'DOCUMENT_ANALYSIS', 'BUSINESS_INTELLIGENCE', 'TECHNICAL_ANALYSIS', 'MARKET_INSIGHTS', 'DATA_VISUALIZATION', 'AI_RECOMMENDATION', 'CODE_ANALYSIS', 'MEETING_SUMMARY', 'GENERAL_AI_RESPONSE') NOT NULL DEFAULT 'GENERAL_AI_RESPONSE',
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `allowComments` BOOLEAN NOT NULL DEFAULT false,
    `isAIGenerated` BOOLEAN NOT NULL DEFAULT false,
    `sourceUrl` TEXT NULL,
    `confidenceScore` DOUBLE NULL,
    `processingTime` INTEGER NULL,
    `includeMetadata` BOOLEAN NOT NULL DEFAULT false,
    `enhanceForSharing` BOOLEAN NOT NULL DEFAULT false,
    `executiveSummary` TEXT NULL,
    `keyInsights` TEXT NULL,
    `sharedBy` VARCHAR(191) NOT NULL,
    `viewCount` INTEGER NOT NULL DEFAULT 0,
    `lastViewed` DATETIME(3) NULL,
    `sharedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NULL,
    `passwordProtected` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `shared_message_shareId_key`(`shareId`),
    INDEX `SharedMessage_shareId_idx`(`shareId`),
    INDEX `SharedMessage_category_idx`(`category`),
    INDEX `SharedMessage_isAIGenerated_idx`(`isAIGenerated`),
    INDEX `SharedMessage_isPublic_idx`(`isPublic`),
    INDEX `SharedMessage_sharedBy_idx`(`sharedBy`),
    INDEX `SharedMessage_sharedAt_idx`(`sharedAt`),
    INDEX `SharedMessage_messageId_idx`(`messageId`),
    INDEX `SharedMessage_directMessageId_idx`(`directMessageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `api_token` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `type` ENUM('SERVICE_ACCOUNT', 'WEBHOOK_INTEGRATION', 'WIDGET_EMBED', 'AGENT_BOT') NOT NULL,
    `profileId` VARCHAR(191) NOT NULL,
    `serverId` VARCHAR(191) NULL,
    `channelIds` TEXT NULL,
    `permissions` TEXT NOT NULL,
    `sourceOrigin` VARCHAR(191) NULL,
    `webhookUrl` TEXT NULL,
    `metadata` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `expiresAt` DATETIME(3) NULL,
    `lastUsed` DATETIME(3) NULL,
    `usageCount` INTEGER NOT NULL DEFAULT 0,
    `rateLimit` INTEGER NOT NULL DEFAULT 100,
    `rateLimitWindow` INTEGER NOT NULL DEFAULT 3600,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `api_token_token_key`(`token`),
    INDEX `ApiToken_profileId_idx`(`profileId`),
    INDEX `ApiToken_serverId_idx`(`serverId`),
    INDEX `ApiToken_type_idx`(`type`),
    INDEX `ApiToken_token_idx`(`token`),
    INDEX `ApiToken_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `agent_profile` (
    `id` VARCHAR(191) NOT NULL,
    `profileId` VARCHAR(191) NOT NULL,
    `apiTokenId` VARCHAR(191) NOT NULL,
    `agentType` ENUM('AI_ASSISTANT', 'VAPI_TRANSCRIBER', 'SYSTEM_NOTIFIER', 'PORTFOLIO_VISITOR', 'WORKFLOW_RESPONDER', 'EXTERNAL_SERVICE') NOT NULL,
    `displayName` VARCHAR(191) NOT NULL,
    `avatarUrl` TEXT NULL,
    `description` TEXT NULL,
    `canImpersonate` BOOLEAN NOT NULL DEFAULT false,
    `canCreateUsers` BOOLEAN NOT NULL DEFAULT false,
    `systemBot` BOOLEAN NOT NULL DEFAULT false,
    `sourceConfig` TEXT NULL,
    `responseConfig` TEXT NULL,
    `isOnline` BOOLEAN NOT NULL DEFAULT false,
    `lastActive` DATETIME(3) NULL,
    `messageCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `agent_profile_profileId_key`(`profileId`),
    UNIQUE INDEX `agent_profile_apiTokenId_key`(`apiTokenId`),
    INDEX `AgentProfile_profileId_idx`(`profileId`),
    INDEX `AgentProfile_apiTokenId_idx`(`apiTokenId`),
    INDEX `AgentProfile_agentType_idx`(`agentType`),
    INDEX `AgentProfile_systemBot_idx`(`systemBot`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `external_message` (
    `id` VARCHAR(191) NOT NULL,
    `apiTokenId` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `channelId` VARCHAR(191) NULL,
    `conversationId` VARCHAR(191) NULL,
    `sourceType` VARCHAR(191) NOT NULL,
    `sourceId` VARCHAR(191) NULL,
    `visitorData` TEXT NULL,
    `processed` BOOLEAN NOT NULL DEFAULT false,
    `messageId` VARCHAR(191) NULL,
    `directMessageId` VARCHAR(191) NULL,
    `error` TEXT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` TEXT NULL,
    `referrer` TEXT NULL,
    `sessionData` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processedAt` DATETIME(3) NULL,

    INDEX `ExternalMessage_apiTokenId_idx`(`apiTokenId`),
    INDEX `ExternalMessage_channelId_idx`(`channelId`),
    INDEX `ExternalMessage_sourceType_idx`(`sourceType`),
    INDEX `ExternalMessage_processed_idx`(`processed`),
    INDEX `ExternalMessage_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visitor_session` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `name` VARCHAR(191) NULL,
    `profileId` VARCHAR(191) NULL,
    `origin` VARCHAR(191) NOT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` TEXT NULL,
    `referrer` TEXT NULL,
    `pageViews` INTEGER NOT NULL DEFAULT 0,
    `messagesCount` INTEGER NOT NULL DEFAULT 0,
    `lastActivity` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `customData` TEXT NULL,
    `tags` TEXT NULL,
    `notes` TEXT NULL,
    `channelId` VARCHAR(191) NULL,
    `conversationId` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `visitor_session_sessionId_key`(`sessionId`),
    INDEX `VisitorSession_sessionId_idx`(`sessionId`),
    INDEX `VisitorSession_profileId_idx`(`profileId`),
    INDEX `VisitorSession_email_idx`(`email`),
    INDEX `VisitorSession_isActive_idx`(`isActive`),
    INDEX `VisitorSession_lastActivity_idx`(`lastActivity`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
