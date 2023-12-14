import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { ContactQuery } from './dto/contactValidator.dto';
import { ConfigService } from '@nestjs/config';
import * as JWT from 'jwt-decode';

@Injectable()
export class AppService {
  private readonly configService: ConfigService;
  private accessToken: string;
  private refreshToken: string;
  private clientId: string;
  private clientSecret: string;
  private redirectUrl: string;

  constructor(configService: ConfigService) {
    this.configService = configService;
    this.loadConfig();
  }

  private loadConfig(): void {
    this.accessToken = this.configService.get('ACCESS_TOKEN');
    this.refreshToken = this.configService.get('REFRESH_TOKEN');
    this.clientId = this.configService.get('CLIENT_ID');
    this.clientSecret = this.configService.get('CLIENT_SECRET');
    this.redirectUrl = this.configService.get('REDIRECT_URL');
  }

  async findContact(query: string): Promise<any> {
    await this.refreshExpiredToken();

    try {
      const response = await axios.get(
        `https://vvelichko2000.amocrm.ru/api/v4/contacts?query=${query}`,
        {
          headers: { Authorization: `Bearer ${this.accessToken}` },
        },
      );

      if (response.status === 204) {
        return null;
      }

      return response.data._embedded.contacts[0];
    } catch (error) {
      throw new HttpException(
        'Failed to fetch contact',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createContact(contactQuery: ContactQuery): Promise<any> {
    const json = [
      {
        name: contactQuery.name,
        custom_fields_values: [
          { field_code: 'PHONE', values: [{ value: contactQuery.phone }] },
          { field_code: 'EMAIL', values: [{ value: contactQuery.email }] },
        ],
      },
    ];

    try {
      const response = await axios.post(
        `https://vvelichko2000.amocrm.ru/api/v4/contacts`,
        json,
        {
          headers: { Authorization: `Bearer ${this.accessToken}` },
        },
      );

      return response.data._embedded.contacts[0];
    } catch (error) {
      throw new HttpException(
        'Failed to create contact',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async updateContact(
    contactId: number,
    contactQuery: ContactQuery,
  ): Promise<any> {
    const json = {
      name: contactQuery.name,
      custom_fields_values: [
        { field_code: 'PHONE', values: [{ value: contactQuery.phone }] },
        { field_code: 'EMAIL', values: [{ value: contactQuery.email }] },
      ],
    };

    try {
      const response = await axios.patch(
        `https://vvelichko2000.amocrm.ru/api/v4/contacts/${contactId}`,
        json,
        { headers: { Authorization: `Bearer ${this.accessToken}` } },
      );

      return response.data;
    } catch (error) {
      throw new HttpException(
        'Failed to update contact',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createLead(contactId: number): Promise<any> {
    const json = [
      {
        name: 'Example 1',
        price: 10000,
        _embedded: {
          contacts: [{ id: contactId }],
        },
      },
    ];

    try {
      const response = await axios.post(
        `https://vvelichko2000.amocrm.ru/api/v4/leads`,
        json,
        { headers: { Authorization: `Bearer ${this.accessToken}` } },
      );

      return response.data._embedded.leads[0];
    } catch (error) {
      throw new HttpException(
        'Failed to create lead',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async refreshExpiredToken(): Promise<void> {
    const decoded = JWT.jwtDecode<JWT.JwtPayload>(this.accessToken);
    const now = Math.round(new Date().getTime() / 1000);

    if (now >= decoded.exp) {
      const json = {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
        redirect_uri: this.redirectUrl,
      };

      try {
        const response = await axios.post(
          `https://vvelichko2000.amocrm.ru/oauth2/access_token`,
          json,
        );

        this.accessToken = response.data.access_token;
        this.refreshToken = response.data.refresh_token;
      } catch (error) {
        throw new HttpException(
          'Failed to refresh access token',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }
}
