import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import { UtilsService } from '@services/utils.service';
import { WebScraperService } from './web-scraper.service';
import { CookiesService } from '../cookies/cookies.service';

describe('WebScraperService', () => {
  let app: TestingModule;
  let webScraperService: WebScraperService;

  const mockCookiesService = {
    findAll: jest.fn().mockResolvedValue([]),
  };

  beforeAll(async () => {
    app = await Test.createTestingModule({
      providers: [
        WebScraperService,
        UtilsService,
        ConfigService,
        {
          provide: CookiesService,
          useValue: mockCookiesService,
        },
      ],
    }).compile();

    webScraperService = app.get<WebScraperService>(WebScraperService);
  });

  describe('transformParsedData', () => {
    it('transforms titles to camelCase and values to numbers', () => {
      const input = [
        { title: 'Total Revenue', value: '1 234,56' },
        { title: 'Net Profit', value: '567,89' },
        { title: 'Gross Margin (%)', value: '12,5' },
      ];

      const result = webScraperService.transformParsedData(input);

      expect(result).toEqual({
        totalRevenue: 1234.56,
        netProfit: 567.89,
        grossMargin: 12.5,
      });
    });

    it('handles special characters in title', () => {
      const input = [{ title: 'Cash & Equivalents', value: '999,99' }];
      const result = webScraperService.transformParsedData(input);
      expect(result).toEqual({ cashEquivalents: 999.99 });
    });

    it('handles empty input', () => {
      expect(webScraperService.transformParsedData([])).toEqual({});
    });

    it('returns NaN for non-numeric values', () => {
      const input = [{ title: 'Invalid Number', value: 'abc' }];
      const result = webScraperService.transformParsedData(input);
      expect(result.invalidNumber).toEqual('abc');
    });

    it('keeps non-numeric values as strings', () => {
      const input = [
        { title: 'Status', value: 'N/A' },
        { title: 'Total Revenue', value: '1 000,00' },
      ];

      const result = webScraperService.transformParsedData(input);

      expect(result).toEqual({
        status: 'N/A',
        totalRevenue: 1000,
      });
    });
  });
});
