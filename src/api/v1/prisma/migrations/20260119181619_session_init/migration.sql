/*
  Warnings:

  - You are about to alter the column `otp_expiration` on the `user_secrets` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.

*/
-- AlterTable
ALTER TABLE `user_secrets` MODIFY `otp_expiration` DATETIME NOT NULL;

-- CreateTable
CREATE TABLE `Session` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `purpose` ENUM('SPIRITUAL_WRITINGS', 'MEMORIZE_PLAY_LINES', 'PREPARE_EXAMS', 'PRESENTATIONS_SPEAKING', 'POETRY_LITERATURE', 'OTHER') NULL,
    `inputMethod` ENUM('VOICE_RECORD', 'TYPE_PASTE') NOT NULL DEFAULT 'TYPE_PASTE',
    `wordCount` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Session_user_id_idx`(`user_id`),
    INDEX `Session_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SessionPractice` (
    `id` VARCHAR(191) NOT NULL,
    `session_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `duration` INTEGER NULL,
    `accuracy` DOUBLE NULL,
    `wordsRecalled` INTEGER NULL,
    `promptsUsed` INTEGER NOT NULL DEFAULT 0,
    `improvementTip` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SessionPractice_session_id_idx`(`session_id`),
    INDEX `SessionPractice_user_id_idx`(`user_id`),
    INDEX `SessionPractice_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SessionPractice` ADD CONSTRAINT `SessionPractice_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `Session`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SessionPractice` ADD CONSTRAINT `SessionPractice_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
