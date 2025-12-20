import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) { }

  async getSettings() {
    let settings = await this.prisma.settings.findFirst();

    // If no settings exist, create default settings
    if (!settings) {
      settings = await this.prisma.settings.create({
        data: {
          siteName: 'Web Truyen Tien Hung',
          siteDescription: 'Nền tảng đọc truyện online',
          maintenanceMode: false,
          allowRegistration: true,
          requireEmailVerification: false,
        },
      });
    }

    return settings;
  }

  async updateSettings(updateSettingsDto: UpdateSettingsDto) {
    // Convert empty strings to null for optional string fields (not boolean)
    const cleanedData: any = {};
    for (const [key, value] of Object.entries(updateSettingsDto)) {
      if (value === '' && typeof value === 'string') {
        // Convert empty string to null for optional fields
        cleanedData[key] = null;
      } else if (value === undefined) {
        // Skip undefined values
        continue;
      } else {
        cleanedData[key] = value;
      }
    }

    let settings = await this.prisma.settings.findFirst();

    if (!settings) {
      // Create if doesn't exist
      settings = await this.prisma.settings.create({
        data: cleanedData,
      });
    } else {
      // Update existing
      settings = await this.prisma.settings.update({
        where: { id: settings.id },
        data: cleanedData,
      });
    }

    return settings;
  }
}
