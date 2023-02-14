create table if not exists card (
	id varchar(22) primary key,
	ygo_id varchar (22) unique not null,
	name varchar (100) not null,
	alias varchar (100),
	pic_url varchar(1000)
);

create table if not exists game (
	id varchar(22) primary key,
	name varchar(100) not null,
	short_name varchar (22) not null,
	platform varchar(100) not null,
	release_date timestamp
);

create table if not exists booster (
	id varchar(22) primary key,
	name varchar(100) not null,
	game_id varchar(22) not null,
--	cover_card_name varchar(100) not null,
	cover_card_id varchar(22),
	price decimal not null,
	cards_per_pack int not null,
	pack_number int,
	unlock_info varchar(1000) not null,
	foreign key(game_id) references game(id),
--	foreign key(cover_card_name) references card(name),
	foreign key(cover_card_id) references card(id)
);

create table if not exists rarity (
	id varchar(22) primary key,
	name varchar(100) not null,
	class int not null
);

create table if not exists booster_card (
	id varchar(22) primary key,
	card_id varchar(22) not null,
	booster_id varchar(22) not null,
	rarity_id varchar(22) not null,
	foreign key(card_id) references card(id),
	foreign key(booster_id) references booster(id),
	foreign key(rarity_id) references rarity(id)
);

insert into rarity values ('4Pxb4aj6BQu5dgsQQXeRCe', 'none', 0);
insert into rarity values ('bMmradd6rRyP3j4MRqvc69', 'common', 1);
insert into rarity values ('fQjrFpuv7rniPxzueLDXBh', 'rare', 2);
insert into rarity values ('dSha8VQUz5BzaybQLD5zws', 'super rare', 3);
insert into rarity values ('6uvQQhC615BSYWPpM2Tz14', 'ultra rare', 4);

insert into game values ('6UBoEL9jPt93XXQcsqWcwP', 'None', 'NONE', 'NONE', null);
insert into game values ('2Ycwxe5HmkRXqimFKkWzam', 'Tag Force 1', 'TF1', 'PSP', null);
insert into game values ('kMhLWG4TpMvpyN71vNiwk9', 'Tag Force 2', 'TF2', 'PSP', null);
insert into game values ('5zAS6r1fo5dAswJ8BbiWsv', 'Tag Force 3', 'TF3', 'PSP', null);
insert into game values ('35MF5jDZqEq1hH1QrvfgTQ', 'Tag Force 4', 'TF4', 'PSP', null);
insert into game values ('ebGS3HQuw3Tw3PRGDoNTcR', 'Tag Force 5', 'TF5', 'PSP', null);
insert into game values ('ha7w7T2i685CWGzDxw2Rhq', 'Tag Force 6', 'TF6', 'PSP', null);
insert into game values ('1DP6iRScu5mRwh1QJGF3kK', 'Tag Force Special', 'TFS', 'PSP', null);
insert into game values ('suoMZMQUg6AqrKJmSHjfqx', 'Tag Force Evolution', 'TFE', 'PS2', null);