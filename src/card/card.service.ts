import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import CardEntity from './entity/card.entity';

@Injectable()
export class CardService {

    constructor(
        @InjectDataSource() private dataSource: DataSource,
    ) {}

    async getCardsByName(name: string) {
        
        const results = await this.dataSource.createQueryBuilder()
            .select(['c.name as card_name, c.id as card_id, c.alias, b.name as booster_name, b.id as booster_id, b.unlock_info, g.name as game_name, g.id as game_id, r.name as rarity_name, r.id as rarity_id'])
            .from('card', 'c')
            .innerJoin('booster_card', 'bc', 'c.id = bc.card_id')
            .innerJoin('booster', 'b', 'b.id = bc.booster_id')
            .innerJoin('game', 'g', 'g.id = b.game_id')
            .innerJoin('rarity', 'r', 'r.id = bc.rarity_id')
            .where('lower(c.name) LIKE :name', {name: `%${name.toLowerCase()}%`})
            .orWhere('lower(c.alias) LIKE :alias', {alias: `%${name.toLowerCase()}%`})
            .orderBy('c.name, g.name, b.name')
            .getRawMany()

        return results
    }
}
