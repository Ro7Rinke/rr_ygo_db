import { Controller, Get, Param, Query } from '@nestjs/common';
import { CardService } from './card.service';

@Controller('card')
export class CardController {
    constructor(private readonly cardService: CardService) { }

    @Get('search?')
    async getCardsByName(@Query('name') name: string) {
        return await this.cardService.getCardsByName(name)
    }
}
