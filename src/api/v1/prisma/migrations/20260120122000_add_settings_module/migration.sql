/*
  Warnings:

  - You are about to alter the column `otp_expiration` on the `user_secrets` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.

*/
-- AlterTable
ALTER TABLE `user_details` ADD COLUMN `pause_duration` INTEGER NULL DEFAULT 2,
    ADD COLUMN `word_cue_number` INTEGER NULL DEFAULT 2;

-- AlterTable
ALTER TABLE `user_secrets` MODIFY `otp_expiration` DATETIME NOT NULL;

-- CreateTable
CREATE TABLE `referal_code` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `referal_code_user_id_key`(`user_id`),
    UNIQUE INDEX `referal_code_code_key`(`code`),
    INDEX `referal_code_user_id_idx`(`user_id`),
    INDEX `referal_code_code_idx`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_settings` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `notifications` BOOLEAN NOT NULL DEFAULT true,
    `facebook_connected` BOOLEAN NOT NULL DEFAULT false,
    `google_connected` BOOLEAN NOT NULL DEFAULT false,
    `apple_connected` BOOLEAN NOT NULL DEFAULT false,
    `facebook_token` VARCHAR(255) NULL,
    `google_token` VARCHAR(255) NULL,
    `apple_token` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_settings_user_id_key`(`user_id`),
    INDEX `user_settings_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `faq` (
    `id` VARCHAR(191) NOT NULL,
    `question` VARCHAR(500) NOT NULL,
    `answer` LONGTEXT NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `faq_order_idx`(`order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `referral_reward` (
    `id` VARCHAR(191) NOT NULL,
    `referrer_id` VARCHAR(191) NOT NULL,
    `referred_user_id` VARCHAR(191) NULL,
    `referral_code` VARCHAR(50) NOT NULL,
    `reward_type` VARCHAR(50) NULL,
    `reward_amount` INTEGER NULL,
    `is_claimed` BOOLEAN NOT NULL DEFAULT false,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `referral_reward_referrer_id_idx`(`referrer_id`),
    INDEX `referral_reward_referred_user_id_idx`(`referred_user_id`),
    INDEX `referral_reward_referral_code_idx`(`referral_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `referal_code` ADD CONSTRAINT `referal_code_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_settings` ADD CONSTRAINT `user_settings_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `referral_reward` ADD CONSTRAINT `referral_reward_referrer_id_fkey` FOREIGN KEY (`referrer_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `referral_reward` ADD CONSTRAINT `referral_reward_referred_user_id_fkey` FOREIGN KEY (`referred_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
