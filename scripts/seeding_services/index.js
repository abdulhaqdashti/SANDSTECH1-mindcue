const { prisma } = require("@configs/prisma");

const seeding_data = require("../seeding_data");

class SeedingService {
  truncate_table_data = async ({ table, where }) => {
    return await prisma[table].deleteMany({ where });
  };

  get_table_data = async ({ table, where }) => {
    return await prisma[table].findMany({ where });
  };

  create_table_data = async ({ table, data }) => {
    const create_promises = data.map((item) =>
      prisma[table].create({ data: item })
    );
    return await Promise.all(create_promises);
  };

  seed_admin = async () => {
    try {
      const admin = await this.get_table_data({
        table: "users",
        where: { user_type: "ADMIN" },
      });

      if (admin.length > 0) return console.log("already created");

      await this.truncate_table_data({
        table: "users",
        where: { user_type: "ADMIN" },
      });

      await this.create_table_data({
        table: "users",
        data: seeding_data.admin_data,
      });
    } catch (error) {
      console.error("something went wrong", error);
    }
  };

  seed_terms_and_conditions = async () => {
    try {
      const existed = await this.get_table_data({
        table: "terms_and_conditions",
      });

      if (existed.length > 0) {
        console.log("already seeded terms and conditions");
        return;
      }

      await this.create_table_data({
        table: "terms_and_conditions",
        data: seeding_data.terms_and_conditions,
      });
      
      console.log("✅ Terms and Conditions seeded successfully!");
    } catch (error) {
      console.error("❌ Error seeding terms and conditions:", error);
    }
  };

  seed_about_app = async () => {
    try {
      const existed = await this.get_table_data({
        table: "about_app",
      });

      if (existed.length > 0) {
        console.log("already seeded about app");
        return;
      }

      await this.create_table_data({
        table: "about_app",
        data: seeding_data.about_app,
      });
      
      console.log("✅ About App seeded successfully!");
    } catch (error) {
      console.error("❌ Error seeding about app:", error);
    }
  };

  seed_privacy_policy = async () => {
    try {
      const existed = await this.get_table_data({
        table: "privacy_policy",
      });

      if (existed.length > 0) {
        console.log("ℹ️  Privacy Policy already exists, skipping...");
        return;
      }

      console.log("🌱 Seeding Privacy Policy...");
      const result = await this.create_table_data({
        table: "privacy_policy",
        data: seeding_data.privacy_policy,
      });
      
      console.log("✅ Privacy Policy seeded successfully!", result.length, "record(s) created");
    } catch (error) {
      console.error("❌ Error seeding privacy policy:", error.message);
      console.error(error);
    }
  };

  seed_faq = async () => {
    try {
      const existed = await this.get_table_data({
        table: "faq",
      });

      if (existed.length > 0) {
        console.log("already seeded FAQ");
        return;
      }

      await this.create_table_data({
        table: "faq",
        data: seeding_data.faq,
      });
      
      console.log("✅ FAQ seeded successfully!");
    } catch (error) {
      console.error("❌ Error seeding FAQ:", error);
    }
  };
}

module.exports = SeedingService;
