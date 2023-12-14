import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { ContactQuery } from './dto/contactValidator.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async createContactAndLead(@Query() contactQuery: ContactQuery) {
    // поиск по номеру телефона
    let contact = await this.appService.findContact(contactQuery.phone);
    if (!contact) {
      // Поиск по email
      contact = await this.appService.findContact(contactQuery.email);
      if (!contact) {
        // Создание нового контакта, в случае отсутсвия
        contact = await this.appService.createContact(contactQuery);
      }
    }
    // Обновление существующего контакта
    contact = await this.appService.updateContact(contact.id, contactQuery);
    // Создание сделки
    const lead = await this.appService.createLead(contact.id);
    return lead;
  }
}
