import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get ad analytics for a specific ad
   */
  async getAdAnalytics(
    adId: string,
    dateRange?: { from: Date; to: Date },
  ) {
    const ad = await this.prisma.ad.findUnique({
      where: { id: adId },
      include: {
        campaign: true,
        createdBy: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
    });

    if (!ad) {
      throw new NotFoundException('Ad not found');
    }

    const where = dateRange
      ? {
          adId,
          createdAt: {
            gte: dateRange.from,
            lte: dateRange.to,
          },
        }
      : { adId };

    // Get impressions grouped by date
    const impressions = await this.prisma.adImpression.groupBy({
      by: ['createdAt'],
      where,
      _count: true,
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Get clicks grouped by date
    const clicks = await this.prisma.adClick.groupBy({
      by: ['createdAt'],
      where,
      _count: true,
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Total stats
    const totalImpressions = await this.prisma.adImpression.count({ where });
    const totalClicks = await this.prisma.adClick.count({ where });
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    // Device breakdown
    const deviceBreakdown = await this.prisma.adImpression.groupBy({
      by: ['device'],
      where,
      _count: true,
    });

    // Top performing hours
    const hourlyData = await this.prisma.$queryRaw<
      Array<{ hour: number; impressions: number; clicks: number }>
    >`
      SELECT 
        EXTRACT(HOUR FROM ai.created_at) as hour,
        COUNT(DISTINCT ai.id) as impressions,
        COUNT(DISTINCT ac.id) as clicks
      FROM ad_impressions ai
      LEFT JOIN ad_clicks ac ON ac.ad_id = ai.ad_id AND DATE_TRUNC('hour', ac.created_at) = DATE_TRUNC('hour', ai.created_at)
      WHERE ai.ad_id = ${adId}
      ${dateRange ? `AND ai.created_at BETWEEN ${dateRange.from} AND ${dateRange.to}` : ''}
      GROUP BY EXTRACT(HOUR FROM ai.created_at)
      ORDER BY hour
    `;

    return {
      ad: {
        id: ad.id,
        title: ad.title,
        type: ad.type,
        position: ad.position,
        campaign: ad.campaign
          ? {
              id: ad.campaign.id,
              name: ad.campaign.name,
            }
          : null,
      },
      stats: {
        totalImpressions,
        totalClicks,
        ctr: parseFloat(ctr.toFixed(2)),
        deviceBreakdown: deviceBreakdown.map((d) => ({
          device: d.device || 'unknown',
          count: d._count,
          percentage: parseFloat(
            ((d._count / totalImpressions) * 100).toFixed(2),
          ),
        })),
      },
      dailyData: this.aggregateDailyData(impressions, clicks),
      hourlyData,
    };
  }

  /**
   * Get campaign analytics
   */
  async getCampaignAnalytics(campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        ads: {
          include: {
            _count: {
              select: {
                adImpressions: true,
                adClicks: true,
              },
            },
          },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    const totalImpressions = campaign.ads.reduce(
      (sum, ad) => sum + ad._count.adImpressions,
      0,
    );
    const totalClicks = campaign.ads.reduce(
      (sum, ad) => sum + ad._count.adClicks,
      0,
    );
    const avgCtr =
      totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    return {
      campaign: {
        id: campaign.id,
        name: campaign.name,
        budget: campaign.budget,
        spent: campaign.spent,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        isActive: campaign.isActive,
      },
      stats: {
        totalAds: campaign.ads.length,
        totalImpressions,
        totalClicks,
        avgCtr: parseFloat(avgCtr.toFixed(2)),
        remainingBudget: campaign.budget
          ? campaign.budget - campaign.spent
          : null,
      },
      ads: campaign.ads.map((ad) => ({
        id: ad.id,
        title: ad.title,
        type: ad.type,
        impressions: ad._count.adImpressions,
        clicks: ad._count.adClicks,
        ctr:
          ad._count.adImpressions > 0
            ? parseFloat(
                ((ad._count.adClicks / ad._count.adImpressions) * 100).toFixed(
                  2,
                ),
              )
            : 0,
      })),
    };
  }

  /**
   * Get overall ad platform analytics
   */
  async getPlatformAnalytics(dateRange?: { from: Date; to: Date }) {
    const where = dateRange
      ? {
          createdAt: {
            gte: dateRange.from,
            lte: dateRange.to,
          },
        }
      : {};

    const [totalImpressions, totalClicks, totalAds, activeCampaigns] =
      await Promise.all([
        this.prisma.adImpression.count({ where }),
        this.prisma.adClick.count({ where }),
        this.prisma.ad.count({
          where: { isActive: true },
        }),
        this.prisma.campaign.count({
          where: { isActive: true },
        }),
      ]);

    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    // Top performing ads
    const topAds = await this.prisma.ad.findMany({
      take: 10,
      orderBy: [
        { impressions: 'desc' },
        { clickCount: 'desc' },
      ],
      include: {
        _count: {
          select: {
            adImpressions: true,
            adClicks: true,
          },
        },
      },
    });

    return {
      overview: {
        totalImpressions,
        totalClicks,
        ctr: parseFloat(ctr.toFixed(2)),
        totalAds,
        activeCampaigns,
      },
      topPerformingAds: topAds.map((ad) => ({
        id: ad.id,
        title: ad.title,
        type: ad.type,
        impressions: ad._count.adImpressions,
        clicks: ad._count.adClicks,
        ctr:
          ad._count.adImpressions > 0
            ? parseFloat(
                ((ad._count.adClicks / ad._count.adImpressions) * 100).toFixed(
                  2,
                ),
              )
            : 0,
      })),
    };
  }

  /**
   * Helper: Aggregate daily data from grouped results
   */
  private aggregateDailyData(
    impressions: Array<{ createdAt: Date; _count: number }>,
    clicks: Array<{ createdAt: Date; _count: number }>,
  ) {
    const dateMap = new Map<string, { impressions: number; clicks: number }>();

    // Aggregate impressions
    impressions.forEach((item) => {
      const date = item.createdAt.toISOString().split('T')[0];
      const existing = dateMap.get(date) || { impressions: 0, clicks: 0 };
      dateMap.set(date, {
        ...existing,
        impressions: existing.impressions + item._count,
      });
    });

    // Aggregate clicks
    clicks.forEach((item) => {
      const date = item.createdAt.toISOString().split('T')[0];
      const existing = dateMap.get(date) || { impressions: 0, clicks: 0 };
      dateMap.set(date, {
        ...existing,
        clicks: existing.clicks + item._count,
      });
    });

    // Convert to array and calculate CTR
    return Array.from(dateMap.entries())
      .map(([date, data]) => ({
        date,
        impressions: data.impressions,
        clicks: data.clicks,
        ctr:
          data.impressions > 0
            ? parseFloat(((data.clicks / data.impressions) * 100).toFixed(2))
            : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}
