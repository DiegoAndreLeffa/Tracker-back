// ############################## v1.0.0 - Análise Básica de KDA, Farm, Visão e Participação em Abates (KP) ##############################
// /* eslint-disable @typescript-eslint/no-unsafe-argument */
// /* eslint-disable @typescript-eslint/no-unsafe-return */
// /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// /* eslint-disable @typescript-eslint/no-unsafe-call */
// /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// import {
//   Injectable,
//   NotFoundException,
//   BadRequestException,
// } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { Analysis, AnalysisDocument } from './schemas/analysis.schema';
// import { MatchesService } from '../matches/matches.service';
// import { UsersService } from '../users/users.service';

// type InsightType = 'POSITIVE' | 'NEGATIVE' | 'WARNING';

// interface Insight {
//   type: InsightType;
//   title: string;
//   description: string;
// }

// interface MatchMetrics {
//   kills: number;
//   deaths: number;
//   assists: number;
//   csPerMin: number;
//   visionScore: number;
//   killParticipation: number;
// }

// @Injectable()
// export class AnalyzerService {
//   constructor(
//     @InjectModel(Analysis.name) private analysisModel: Model<AnalysisDocument>,
//     private matchesService: MatchesService,
//     private usersService: UsersService,
//   ) {}

//   async analyzeMatchForUser(userId: string, matchId: string) {
//     // 1. Verifica se essa análise já foi feita antes (evita gastar processamento à toa)
//     const existingAnalysis = await this.analysisModel
//       .findOne({ userId, matchId })
//       .exec();
//     if (existingAnalysis) return existingAnalysis;

//     // 2. Busca usuário e a partida
//     const user = await this.usersService.findById(userId);
//     const match = await this.matchesService.findByMatchId(matchId);

//     if (!user || !user.riotAccount)
//       throw new NotFoundException('Conta Riot não vinculada.');
//     if (!match)
//       throw new NotFoundException(
//         'Partida não encontrada no banco. Sincronize primeiro.',
//       );

//     const puuid = user.riotAccount.puuid;

//     // 3. Encontra o nosso jogador dentro dos 10 participantes
//     const participant = match.info.participants.find(
//       (p: any) => p.puuid === puuid,
//     );
//     if (!participant)
//       throw new BadRequestException('O usuário não jogou esta partida.');

//     // 4. Calcula o total de kills do time dele (para calcular a Participação em Abates - KP)
//     const teamId = participant.teamId;
//     const teamKills = match.info.participants
//       .filter((p: any) => p.teamId === teamId)
//       .reduce((acc: number, p: any) => acc + p.kills, 0);

//     // 5. Calcula as Métricas Chave
//     const gameDurationMinutes = match.gameDuration / 60;
//     const csPerMin =
//       (participant.totalMinionsKilled + participant.neutralMinionsKilled) /
//       gameDurationMinutes;
//     const killParticipation =
//       teamKills > 0
//         ? ((participant.kills + participant.assists) / teamKills) * 100
//         : 0;

//     const metrics: MatchMetrics = {
//       kills: participant.kills,
//       deaths: participant.deaths,
//       assists: participant.assists,
//       csPerMin: Number(csPerMin.toFixed(1)),
//       visionScore: participant.visionScore,
//       killParticipation: Number(killParticipation.toFixed(1)),
//     };

//     // 6. 🤖 O MOTOR DE REGRAS (As heurísticas do Coach)
//     const insights = this.generateInsights(
//       metrics,
//       participant.role,
//       gameDurationMinutes,
//     );

//     // 7. Salva a análise no banco e retorna
//     const newAnalysis = new this.analysisModel({
//       userId,
//       matchId,
//       championName: participant.championName,
//       win: participant.win,
//       metrics,
//       insights,
//     });

//     return newAnalysis.save();
//   }

//   // Função privada com a inteligência artificial "baseada em regras"
//   private generateInsights(
//     metrics: MatchMetrics,
//     role: string,
//     duration: number,
//   ): Insight[] {
//     const insights: Insight[] = [];

//     // Regra 1: Farm (CS)
//     if (metrics.csPerMin < 5 && role !== 'SUPPORT') {
//       insights.push({
//         type: 'NEGATIVE',
//         title: 'Farm muito baixo',
//         description: `Você farmou apenas ${metrics.csPerMin} tropas por minuto. O ideal é ficar acima de 7. Tente focar mais em pegar as waves laterais no mid-game.`,
//       });
//     } else if (metrics.csPerMin >= 7.5) {
//       insights.push({
//         type: 'POSITIVE',
//         title: 'Farm Excelente',
//         description:
//           'Seu farm foi de alto nível nesta partida. Isso garantiu uma vantagem enorme de ouro.',
//       });
//     }

//     // Regra 2: Mortes / Posicionamento
//     if (metrics.deaths > 7) {
//       insights.push({
//         type: 'WARNING',
//         title: 'Excesso de Mortes',
//         description: `Você morreu ${metrics.deaths} vezes. Muitas mortes entregam ouro para o inimigo e deixam seu time em desvantagem no mapa. Reveja seu posicionamento e evite lutas desnecessárias.`,
//       });
//     }

//     // Regra 3: Participação em Abates (KP)
//     if (metrics.killParticipation < 40 && role !== 'TOP') {
//       insights.push({
//         type: 'NEGATIVE',
//         title: 'Baixo impacto no mapa',
//         description: `Sua participação em abates foi de apenas ${metrics.killParticipation}%. Você precisa agrupar mais com o time em objetivos (Dragões/Barão).`,
//       });
//     }

//     // Regra 4: Visão (Ward)
//     if (metrics.visionScore < duration * 0.5) {
//       // Ex: Jogo de 30 min, score menor que 15
//       insights.push({
//         type: 'WARNING',
//         title: 'Falta de Visão',
//         description:
//           'Seu placar de visão foi muito baixo. Compre mais Control Wards e use seu trinket sempre que estiver fora de recarga para evitar ganks.',
//       });
//     }

//     // Regra 5: Utilidade / Assistências
//     if (metrics.assists >= 10) {
//       insights.push({
//         type: 'POSITIVE',
//         title: 'Excelente Utilidade',
//         description: `Você participou com ${metrics.assists} assistências! Seu papel ajudando a equipe a garantir abates foi fundamental nesta partida.`,
//       });
//     }

//     // Regra de Fallback: Se o jogador jogou na média (nenhum insight gerado)
//     if (insights.length === 0) {
//       insights.push({
//         type: 'POSITIVE',
//         title: 'Partida Sólida',
//         description:
//           'Você teve um desempenho consistente. Não cometeu erros graves, mas também não teve picos de destaque. Continue assim para manter a constância!',
//       });
//     }

//     return insights;
//   }
// }

// ######################################### v2.0.0 - Matchup e DPM (Dano por Minuto) #########################################
// /* eslint-disable @typescript-eslint/no-unsafe-argument */
// /* eslint-disable @typescript-eslint/no-unsafe-return */
// /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// /* eslint-disable @typescript-eslint/no-unsafe-call */
// /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// import {
//   Injectable,
//   NotFoundException,
//   BadRequestException,
// } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { Analysis, AnalysisDocument } from './schemas/analysis.schema';
// import { MatchesService } from '../matches/matches.service';
// import { UsersService } from '../users/users.service';

// type InsightType = 'POSITIVE' | 'NEGATIVE' | 'WARNING';

// interface Insight {
//   type: InsightType;
//   title: string;
//   description: string;
// }

// interface MatchupStats {
//   opponentChampion: string | null;
//   goldDiff: number;
//   csDiff: number;
// }

// interface MatchMetrics {
//   kills: number;
//   deaths: number;
//   assists: number;
//   csPerMin: number;
//   visionScore: number;
//   killParticipation: number;
//   damagePerMinute: number;
//   objectiveDamage: number;
//   matchup: MatchupStats;
// }

// @Injectable()
// export class AnalyzerService {
//   constructor(
//     @InjectModel(Analysis.name) private analysisModel: Model<AnalysisDocument>,
//     private matchesService: MatchesService,
//     private usersService: UsersService,
//   ) {}

//   async analyzeMatchForUser(userId: string, matchId: string) {
//     const existingAnalysis = await this.analysisModel
//       .findOne({ userId, matchId })
//       .exec();
//     if (existingAnalysis) return existingAnalysis;

//     const user = await this.usersService.findById(userId);
//     const match = await this.matchesService.findByMatchId(matchId);

//     if (!user || !user.riotAccount)
//       throw new NotFoundException('Conta Riot não vinculada.');
//     if (!match)
//       throw new NotFoundException(
//         'Partida não encontrada no banco. Sincronize primeiro.',
//       );

//     const puuid = user.riotAccount.puuid;

//     const participant = match.info.participants.find(
//       (p: any) => p.puuid === puuid,
//     );
//     if (!participant)
//       throw new BadRequestException('O usuário não jogou esta partida.');

//     const teamId = participant.teamId;
//     const teamKills = match.info.participants
//       .filter((p: any) => p.teamId === teamId)
//       .reduce((acc: number, p: any) => acc + p.kills, 0);

//     // Duração em minutos
//     const gameDurationMinutes = match.gameDuration / 60;

//     // CS e KP
//     const totalCs =
//       participant.totalMinionsKilled + participant.neutralMinionsKilled;
//     const csPerMin = totalCs / gameDurationMinutes;
//     const killParticipation =
//       teamKills > 0
//         ? ((participant.kills + participant.assists) / teamKills) * 100
//         : 0;

//     // Dano por Minuto
//     const damagePerMinute =
//       participant.totalDamageDealtToChampions / gameDurationMinutes;

//     // --- MÁGICA DO MATCHUP (Procura o oponente direto) ---
//     // A Riot usa 'teamPosition' (TOP, JUNGLE, MIDDLE, BOTTOM, UTILITY)
//     const position = participant.teamPosition;
//     const opponent = match.info.participants.find(
//       (p: any) => p.teamId !== teamId && p.teamPosition === position,
//     );

//     let matchupStats: MatchupStats = {
//       opponentChampion: null,
//       goldDiff: 0,
//       csDiff: 0,
//     };

//     if (opponent) {
//       const opponentCs =
//         opponent.totalMinionsKilled + opponent.neutralMinionsKilled;
//       matchupStats = {
//         opponentChampion: opponent.championName,
//         goldDiff: participant.goldEarned - opponent.goldEarned,
//         csDiff: totalCs - opponentCs,
//       };
//     }

//     const metrics: MatchMetrics = {
//       kills: participant.kills,
//       deaths: participant.deaths,
//       assists: participant.assists,
//       csPerMin: Number(csPerMin.toFixed(1)),
//       visionScore: participant.visionScore,
//       killParticipation: Number(killParticipation.toFixed(1)),
//       damagePerMinute: Number(damagePerMinute.toFixed(0)),
//       objectiveDamage: participant.damageDealtToObjectives,
//       matchup: matchupStats,
//     };

//     // Gera os insights passando as novas métricas
//     const insights = this.generateInsights(
//       metrics,
//       position, // Usando a posição oficial da Riot agora (Ex: BOTTOM para Ashe)
//       gameDurationMinutes,
//     );

//     const newAnalysis = new this.analysisModel({
//       userId,
//       matchId,
//       championName: participant.championName,
//       win: participant.win,
//       metrics,
//       insights,
//     });

//     return newAnalysis.save();
//   }

//   private generateInsights(
//     metrics: MatchMetrics,
//     position: string,
//     duration: number,
//   ): Insight[] {
//     const insights: Insight[] = [];

//     // 1. Regra de Dano por Minuto (DPM) para Carregadores
//     if (['MIDDLE', 'BOTTOM'].includes(position)) {
//       if (metrics.damagePerMinute < 400) {
//         insights.push({
//           type: 'NEGATIVE',
//           title: 'Baixo Impacto de Dano',
//           description: `Seu Dano Por Minuto (DPM) foi de apenas ${metrics.damagePerMinute}. Como ${position === 'BOTTOM' ? 'Atirador' : 'Mid Laner'}, você precisa ser a principal fonte de dano do time. Tente ser mais agressivo em lutas e acertar mais pokes antes dos confrontos.`,
//         });
//       } else if (metrics.damagePerMinute > 800) {
//         insights.push({
//           type: 'POSITIVE',
//           title: 'Máquina de Dano',
//           description: `Excelente! Seu DPM foi de ${metrics.damagePerMinute}. Você carregou as lutas em equipe e maximizou a produção de dano do seu campeão.`,
//         });
//       }
//     }

//     // 2. Regra do Matchup (O 1v1 da Rota)
//     if (metrics.matchup.opponentChampion) {
//       const opName = metrics.matchup.opponentChampion;

//       // Se abriu mais de 1000 de gold e 15 de CS de vantagem
//       if (metrics.matchup.goldDiff > 1000 && metrics.matchup.csDiff > 15) {
//         insights.push({
//           type: 'POSITIVE',
//           title: `Dominou o(a) ${opName}`,
//           description: `Você destruiu sua rota! Terminou o jogo com ${metrics.matchup.goldDiff} de Ouro a mais e vantagem de ${metrics.matchup.csDiff} tropas em cima do(a) ${opName}. Snowball perfeito.`,
//         });
//       }
//       // Se perdeu feio a rota
//       else if (
//         metrics.matchup.goldDiff < -1000 &&
//         metrics.matchup.csDiff < -15
//       ) {
//         insights.push({
//           type: 'NEGATIVE',
//           title: `Sufoco contra o(a) ${opName}`,
//           description: `Você sofreu na fase de rotas contra o(a) ${opName}, ficando para trás em ouro e farm. Se o matchup for desfavorável, foque apenas em farmar debaixo da torre e esperar o Jungler em vez de forçar trocas.`,
//         });
//       }
//     }

//     // 3. Regra de Objetivos para Junglers e Top Laners
//     if (
//       ['JUNGLE', 'TOP'].includes(position) &&
//       metrics.objectiveDamage < 3000
//     ) {
//       insights.push({
//         type: 'WARNING',
//         title: 'Baixa Pressão em Objetivos',
//         description: `Você causou apenas ${metrics.objectiveDamage} de dano em objetivos (Torres, Dragões, Barão). Seu papel exige que você lidere a tomada de estruturas e monstros épicos.`,
//       });
//     }

//     // --- REGRAS ANTIGAS MANTIDAS (KDA, Visão, KP) ---

//     if (metrics.csPerMin < 5 && position !== 'UTILITY') {
//       // Utility é o Suporte
//       insights.push({
//         type: 'NEGATIVE',
//         title: 'Farm muito baixo',
//         description: `Você farmou apenas ${metrics.csPerMin} tropas por minuto. O ideal é ficar acima de 7. Tente focar mais em pegar as waves laterais no mid-game.`,
//       });
//     }

//     if (metrics.deaths > 7) {
//       insights.push({
//         type: 'WARNING',
//         title: 'Excesso de Mortes',
//         description: `Você morreu ${metrics.deaths} vezes. Muitas mortes entregam ouro para o inimigo e deixam seu time em desvantagem no mapa.`,
//       });
//     }

//     if (metrics.killParticipation < 40 && position !== 'TOP') {
//       insights.push({
//         type: 'NEGATIVE',
//         title: 'Baixo impacto no mapa',
//         description: `Sua participação em abates foi de apenas ${metrics.killParticipation}%. Você precisa agrupar mais com o time em objetivos (Dragões/Barão).`,
//       });
//     }

//     if (metrics.visionScore < duration * 0.5) {
//       insights.push({
//         type: 'WARNING',
//         title: 'Falta de Visão',
//         description:
//           'Seu placar de visão foi muito baixo. Compre mais Control Wards.',
//       });
//     }

//     // Elogio de Assistências (Perfeito para sua Ashe/Suportes)
//     if (metrics.assists >= 10) {
//       insights.push({
//         type: 'POSITIVE',
//         title: 'Excelente Utilidade',
//         description: `Você participou com ${metrics.assists} assistências! Seu papel ajudando a equipe foi fundamental.`,
//       });
//     }

//     // Fallback caso não caia em nenhuma regra
//     if (insights.length === 0) {
//       insights.push({
//         type: 'POSITIVE',
//         title: 'Partida Sólida',
//         description:
//           'Você teve um desempenho consistente. Manteve bons números e cumpriu seu papel na equipe!',
//       });
//     }

//     return insights;
//   }
// }

// ########################### v3.0.0 - Análise Avançada com Machine Learning (Em Breve) ###########################
// /* eslint-disable @typescript-eslint/no-unsafe-argument */
// /* eslint-disable @typescript-eslint/no-unsafe-return */
// /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// /* eslint-disable @typescript-eslint/no-unsafe-call */
// /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// import {
//   Injectable,
//   NotFoundException,
//   BadRequestException,
// } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { Analysis, AnalysisDocument } from './schemas/analysis.schema';
// import { MatchesService } from '../matches/matches.service';
// import { UsersService } from '../users/users.service';

// type InsightType = 'POSITIVE' | 'NEGATIVE' | 'WARNING' | 'CRITICAL';

// interface Insight {
//   type: InsightType;
//   title: string;
//   description: string;
// }

// interface MatchupStats {
//   opponentChampion: string | null;
//   goldDiff: number;
//   csDiff: number;
//   soloKills: number;
// }

// interface AdvancedMetrics {
//   damagePerGold: number;
//   teamDamagePercentage: number;
//   controlWardsPlaced: number;
//   csBefore10Minutes: number;
//   turretPlatesTaken: number;
//   timeSpentDeadPercentage: number;
// }

// interface MatchMetrics {
//   kills: number;
//   deaths: number;
//   assists: number;
//   csPerMin: number;
//   visionScore: number;
//   killParticipation: number;
//   damagePerMinute: number;
//   objectiveDamage: number;
//   matchup: MatchupStats;
//   advanced: AdvancedMetrics;
// }

// @Injectable()
// export class AnalyzerService {
//   constructor(
//     @InjectModel(Analysis.name) private analysisModel: Model<AnalysisDocument>,
//     private matchesService: MatchesService,
//     private usersService: UsersService,
//   ) {}

//   async analyzeMatchForUser(userId: string, matchId: string) {
//     const existingAnalysis = await this.analysisModel
//       .findOne({ userId, matchId })
//       .exec();
//     if (existingAnalysis) return existingAnalysis;

//     const user = await this.usersService.findById(userId);
//     const match = await this.matchesService.findByMatchId(matchId);

//     if (!user || !user.riotAccount)
//       throw new NotFoundException('Conta Riot não vinculada.');
//     if (!match)
//       throw new NotFoundException(
//         'Partida não encontrada no banco. Sincronize primeiro.',
//       );

//     const puuid = user.riotAccount.puuid;
//     const participant = match.info.participants.find(
//       (p: any) => p.puuid === puuid,
//     );
//     if (!participant)
//       throw new BadRequestException('O usuário não jogou esta partida.');

//     const teamId = participant.teamId;
//     const teamKills = match.info.participants
//       .filter((p: any) => p.teamId === teamId)
//       .reduce((acc: number, p: any) => acc + p.kills, 0);

//     const gameDurationMinutes = match.gameDuration / 60;

//     // Extraindo o Tesouro: Objeto "Challenges" da Riot
//     const challenges = participant.challenges || {};

//     const totalCs =
//       participant.totalMinionsKilled + participant.neutralMinionsKilled;
//     const csPerMin = totalCs / gameDurationMinutes;
//     const killParticipation =
//       teamKills > 0
//         ? ((participant.kills + participant.assists) / teamKills) * 100
//         : 0;
//     const damagePerMinute =
//       participant.totalDamageDealtToChampions / gameDurationMinutes;

//     // --- CÁLCULOS AVANÇADOS ---
//     const damagePerGold =
//       participant.goldEarned > 0
//         ? participant.totalDamageDealtToChampions / participant.goldEarned
//         : 0;
//     const timeSpentDeadPercentage =
//       (participant.totalTimeSpentDead / match.gameDuration) * 100;

//     const position = participant.teamPosition; // TOP, JUNGLE, MIDDLE, BOTTOM, UTILITY
//     const opponent = match.info.participants.find(
//       (p: any) => p.teamId !== teamId && p.teamPosition === position,
//     );

//     let matchupStats: MatchupStats = {
//       opponentChampion: null,
//       goldDiff: 0,
//       csDiff: 0,
//       soloKills: challenges.soloKills || 0,
//     };
//     if (opponent) {
//       const opponentCs =
//         opponent.totalMinionsKilled + opponent.neutralMinionsKilled;
//       matchupStats = {
//         opponentChampion: opponent.championName,
//         goldDiff: participant.goldEarned - opponent.goldEarned,
//         csDiff: totalCs - opponentCs,
//         soloKills: challenges.soloKills || 0,
//       };
//     }

//     const metrics: MatchMetrics = {
//       kills: participant.kills,
//       deaths: participant.deaths,
//       assists: participant.assists,
//       csPerMin: Number(csPerMin.toFixed(1)),
//       visionScore: participant.visionScore,
//       killParticipation: Number(killParticipation.toFixed(1)),
//       damagePerMinute: Number(damagePerMinute.toFixed(0)),
//       objectiveDamage: participant.damageDealtToObjectives,
//       matchup: matchupStats,
//       advanced: {
//         damagePerGold: Number(damagePerGold.toFixed(2)),
//         teamDamagePercentage: Number(
//           (challenges.teamDamagePercentage || 0) * 100,
//         ).toFixed(1) as unknown as number,
//         controlWardsPlaced:
//           challenges.controlWardsPlaced ||
//           participant.visionWardsBoughtInGame ||
//           0,
//         csBefore10Minutes: challenges.laneMinionsFirst10Minutes || 0,
//         turretPlatesTaken: challenges.turretPlatesTaken || 0,
//         timeSpentDeadPercentage: Number(timeSpentDeadPercentage.toFixed(1)),
//       },
//     };

//     const insights = this.generateInsights(
//       metrics,
//       position,
//       gameDurationMinutes,
//     );

//     const newAnalysis = new this.analysisModel({
//       userId,
//       matchId,
//       championName: participant.championName,
//       win: participant.win,
//       metrics,
//       insights,
//     });

//     return newAnalysis.save();
//   }

//   private generateInsights(
//     metrics: MatchMetrics,
//     position: string,
//     duration: number,
//   ): Insight[] {
//     const insights: Insight[] = [];
//     const isCarry = ['MIDDLE', 'BOTTOM', 'TOP'].includes(position);
//     const adv = metrics.advanced;

//     // 1. INTELIGÊNCIA DE EFICIÊNCIA DE OURO (O ralo de dinheiro)
//     if (isCarry) {
//       if (adv.damagePerGold < 0.8 && metrics.damagePerMinute < 500) {
//         insights.push({
//           type: 'CRITICAL',
//           title: 'Baixa Eficiência de Ouro',
//           description: `Você converteu apenas ${adv.damagePerGold} de dano para cada 1 de ouro ganho (O ideal é acima de 1.3). Isso significa que você absorveu recursos do mapa (farm/kills), mas não converteu isso em impacto nas lutas.`,
//         });
//       } else if (adv.damagePerGold > 1.5 && adv.teamDamagePercentage > 30) {
//         insights.push({
//           type: 'POSITIVE',
//           title: 'Condição de Vitória (Solo Carry)',
//           description: `Desempenho espetacular! Você causou ${adv.teamDamagePercentage}% de todo o dano do seu time e foi extremamente eficiente com seu ouro (${adv.damagePerGold} dano/ouro). Você foi o verdadeiro carregador da partida.`,
//         });
//       }
//     }

//     // 2. INTELIGÊNCIA DE EARLY GAME (Fase de Rotas)
//     if (position !== 'UTILITY' && position !== 'JUNGLE') {
//       if (adv.csBefore10Minutes < 60) {
//         insights.push({
//           type: 'NEGATIVE',
//           title: 'Early Game Fraco (Farm)',
//           description: `Você farmou apenas ${adv.csBefore10Minutes} tropas nos primeiros 10 minutos. O jogo profissional exige 80+, mas tente bater pelo menos 70. Treine last hit no modo treino, pois perder o early game atrasa muito seus itens.`,
//         });
//       }
//       if (adv.turretPlatesTaken >= 3) {
//         insights.push({
//           type: 'POSITIVE',
//           title: 'Dominância de Rota (Barricadas)',
//           description: `Você derrubou ${adv.turretPlatesTaken} barricadas na fase de rotas. Isso gerou uma injeção massiva de ouro extra para você acelerar seu pico de poder (Spike). Excelente controle de wave!`,
//         });
//         // OBS: Todas as torres tem barricadas, não só a primeira. Então é possível pegar plates mesmo perdendo a torre, se matar o inimigo perto dela. Por isso não colocamos um aviso de "perdeu a torre sem pegar plates", pois pode ser intencional para garantir o gold do adversário.
//       }
//     }

//     // 3. INTELIGÊNCIA DE TEMPO MORTO (A tela cinza)
//     if (adv.timeSpentDeadPercentage > 12) {
//       insights.push({
//         type: 'CRITICAL',
//         title: 'Excesso de Tempo Morto',
//         description: `Você passou ${adv.timeSpentDeadPercentage}% da partida inteira com a tela cinza esperando renascer. Além de dar ouro ao inimigo, você deixou seu time jogando 4v5 por muito tempo. Valorize mais a sua vida!`,
//       });
//     }

//     // 4. INTELIGÊNCIA DE VISÃO (Score por Minuto + Control Wards)
//     const visionPerMin = metrics.visionScore / duration; // <-- AQUI USAMOS O DURATION!

//     if (position === 'UTILITY') {
//       if (visionPerMin < 1.5) {
//         insights.push({
//           type: 'WARNING',
//           title: 'Placar de Visão Baixo',
//           description: `Seu placar de visão foi de ${visionPerMin.toFixed(1)} por minuto. Como Suporte, sua meta mínima é 1.5/min. Ande mais com o Jungler para wardar a selva inimiga.`,
//         });
//       }
//       if (adv.controlWardsPlaced < 3) {
//         insights.push({
//           type: 'CRITICAL',
//           title: 'Negligência de Visão (Control Wards)',
//           description: `Você colocou apenas ${adv.controlWardsPlaced} Control Wards (Pink) no jogo todo. É obrigação do Suporte garantir controle absoluto de área em Dragões e Barões. Compre mais Pinks!`,
//         });
//       }
//     } else {
//       if (visionPerMin < 0.5) {
//         insights.push({
//           type: 'WARNING',
//           title: 'Falta de Visão no Mapa',
//           description: `Seu placar de visão (${visionPerMin.toFixed(1)}/min) está muito baixo. Lembre-se de usar seu trinket sempre que estiver fora de recarga para proteger sua rota contra ganks.`,
//         });
//       }
//       if (adv.controlWardsPlaced === 0) {
//         insights.push({
//           type: 'NEGATIVE',
//           title: 'Zero Control Wards',
//           description: `Você terminou o jogo inteiro sem colocar uma única Control Ward (Pink). Visão não é dever apenas do suporte. Compre uma Pink sempre que sobrar 75 de gold na base.`,
//         });
//       }
//     }

//     // 5. INTELIGÊNCIA DE MATCHUP (Solo Kills)
//     if (metrics.matchup.soloKills >= 3) {
//       insights.push({
//         type: 'POSITIVE',
//         title: 'Mecânica Afiada (Solo Kills)',
//         description: `Você conseguiu ${metrics.matchup.soloKills} eliminações solo! Isso mostra que sua mecânica e conhecimento dos limites do seu campeão no 1v1 estão excelentes.`,
//       });
//     }

//     // 6. PARTICIPAÇÃO EM ABATES (KP)
//     if (metrics.killParticipation < 40 && position !== 'TOP') {
//       insights.push({
//         type: 'NEGATIVE',
//         title: 'Baixo impacto no mapa',
//         description: `Sua participação em abates foi de apenas ${metrics.killParticipation}%. Tente jogar mais próximo da sua equipe nas rotações do mid-game.`,
//       });
//     }

//     // FALLBACK
//     if (insights.length === 0) {
//       insights.push({
//         type: 'POSITIVE',
//         title: 'Partida Sólida e Equilibrada',
//         description:
//           'Seus números foram estáveis. Boa eficiência, sem excesso de mortes e contribuição honesta para a equipe.',
//       });
//     }

//     return insights;
//   }
// }

// ################################ v4.0.0 - Análise  ################################
// /* eslint-disable @typescript-eslint/no-unsafe-argument */
// /* eslint-disable @typescript-eslint/no-unsafe-return */
// /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// /* eslint-disable @typescript-eslint/no-unsafe-call */
// /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// import {
//   Injectable,
//   NotFoundException,
//   BadRequestException,
// } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { Analysis, AnalysisDocument } from './schemas/analysis.schema';
// import { MatchesService } from '../matches/matches.service';
// import { UsersService } from '../users/users.service';

// type InsightType =
//   | 'POSITIVE'
//   | 'NEGATIVE'
//   | 'WARNING'
//   | 'CRITICAL'
//   | 'COACHING';

// interface Insight {
//   type: InsightType;
//   title: string;
//   description: string;
// }

// interface MatchupStats {
//   opponentChampion: string | null;
//   goldDiff: number;
//   csDiff: number;
//   soloKills: number;
// }

// interface AdvancedMetrics {
//   damagePerGold: number;
//   teamDamagePercentage: number;
//   controlWardsPlaced: number;
//   csBefore10Minutes: number;
//   turretPlatesTaken: number;
//   timeSpentDeadPercentage: number;
//   // --- NOVAS MÉTRICAS 5X ANALÍTICAS ---
//   ccScore: number;
//   damageMitigated: number;
//   healAndShield: number;
//   kitedKills: number;
//   epicMonsterSteals: number;
//   firstBloodInvolvement: boolean;
//   skillshotsDodged: number;
// }

// interface MatchMetrics {
//   kills: number;
//   deaths: number;
//   assists: number;
//   csPerMin: number;
//   visionScore: number;
//   killParticipation: number;
//   damagePerMinute: number;
//   objectiveDamage: number;
//   matchup: MatchupStats;
//   advanced: AdvancedMetrics;
// }

// @Injectable()
// export class AnalyzerService {
//   constructor(
//     @InjectModel(Analysis.name) private analysisModel: Model<AnalysisDocument>,
//     private matchesService: MatchesService,
//     private usersService: UsersService,
//   ) {}

//   async analyzeMatchForUser(userId: string, matchId: string) {
//     const existingAnalysis = await this.analysisModel
//       .findOne({ userId, matchId })
//       .exec();
//     if (existingAnalysis) return existingAnalysis;

//     const user = await this.usersService.findById(userId);
//     const match = await this.matchesService.findByMatchId(matchId);

//     if (!user || !user.riotAccount)
//       throw new NotFoundException('Conta Riot não vinculada.');
//     if (!match)
//       throw new NotFoundException(
//         'Partida não encontrada no banco. Sincronize primeiro.',
//       );

//     const puuid = user.riotAccount.puuid;
//     const participant = match.info.participants.find(
//       (p: any) => p.puuid === puuid,
//     );
//     if (!participant)
//       throw new BadRequestException('O usuário não jogou esta partida.');

//     const teamId = participant.teamId;
//     const teamKills = match.info.participants
//       .filter((p: any) => p.teamId === teamId)
//       .reduce((acc: number, p: any) => acc + p.kills, 0);

//     const gameDurationMinutes = match.gameDuration / 60;
//     const challenges = participant.challenges || {};

//     const totalCs =
//       participant.totalMinionsKilled + participant.neutralMinionsKilled;
//     const csPerMin = totalCs / gameDurationMinutes;
//     const killParticipation =
//       teamKills > 0
//         ? ((participant.kills + participant.assists) / teamKills) * 100
//         : 0;
//     const damagePerMinute =
//       participant.totalDamageDealtToChampions / gameDurationMinutes;
//     const damagePerGold =
//       participant.goldEarned > 0
//         ? participant.totalDamageDealtToChampions / participant.goldEarned
//         : 0;
//     const timeSpentDeadPercentage =
//       (participant.totalTimeSpentDead / match.gameDuration) * 100;

//     const position = participant.teamPosition;
//     const opponent = match.info.participants.find(
//       (p: any) => p.teamId !== teamId && p.teamPosition === position,
//     );

//     let matchupStats: MatchupStats = {
//       opponentChampion: null,
//       goldDiff: 0,
//       csDiff: 0,
//       soloKills: challenges.soloKills || 0,
//     };
//     if (opponent) {
//       const opponentCs =
//         opponent.totalMinionsKilled + opponent.neutralMinionsKilled;
//       matchupStats = {
//         opponentChampion: opponent.championName,
//         goldDiff: participant.goldEarned - opponent.goldEarned,
//         csDiff: totalCs - opponentCs,
//         soloKills: challenges.soloKills || 0,
//       };
//     }

//     const metrics: MatchMetrics = {
//       kills: participant.kills,
//       deaths: participant.deaths,
//       assists: participant.assists,
//       csPerMin: Number(csPerMin.toFixed(1)),
//       visionScore: participant.visionScore,
//       killParticipation: Number(killParticipation.toFixed(1)),
//       damagePerMinute: Number(damagePerMinute.toFixed(0)),
//       objectiveDamage: participant.damageDealtToObjectives,
//       matchup: matchupStats,
//       advanced: {
//         damagePerGold: Number(damagePerGold.toFixed(2)),
//         teamDamagePercentage: Number(
//           (challenges.teamDamagePercentage || 0) * 100,
//         ).toFixed(1) as unknown as number,
//         controlWardsPlaced:
//           challenges.controlWardsPlaced ||
//           participant.visionWardsBoughtInGame ||
//           0,
//         csBefore10Minutes: challenges.laneMinionsFirst10Minutes || 0,
//         turretPlatesTaken: challenges.turretPlatesTaken || 0,
//         timeSpentDeadPercentage: Number(timeSpentDeadPercentage.toFixed(1)),
//         // 5x Analítico:
//         ccScore: participant.timeCCingOthers || 0,
//         damageMitigated: participant.damageSelfMitigated || 0,
//         healAndShield:
//           (participant.totalHealsOnTeammates || 0) +
//           (participant.totalDamageShieldedOnTeammates || 0),
//         kitedKills: challenges.kitedKills || 0,
//         epicMonsterSteals: challenges.epicMonsterSteals || 0,
//         firstBloodInvolvement:
//           participant.firstBloodKill || participant.firstBloodAssist || false,
//         skillshotsDodged: challenges.skillshotsDodged || 0,
//       },
//     };

//     const insights = this.generateInsights(
//       metrics,
//       position,
//       gameDurationMinutes,
//     );

//     const newAnalysis = new this.analysisModel({
//       userId,
//       matchId,
//       championName: participant.championName,
//       win: participant.win,
//       metrics,
//       insights,
//     });

//     return newAnalysis.save();
//   }

//   private generateInsights(
//     metrics: MatchMetrics,
//     position: string,
//     duration: number,
//   ): Insight[] {
//     const insights: Insight[] = [];
//     const adv = metrics.advanced;
//     const isCarry = ['MIDDLE', 'BOTTOM'].includes(position);
//     const isFrontline = ['TOP', 'JUNGLE'].includes(position);

//     // 1. A SÍNDROME DO COINFLIP (Kills altas, Mortes Altas = Entregando o Jogo)
//     if (metrics.kills >= 10 && metrics.deaths >= 8) {
//       insights.push({
//         type: 'CRITICAL',
//         title: 'Jogando no Cara ou Coroa (Throws)',
//         description: `Você pegou ${metrics.kills} abates, mas morreu ${metrics.deaths} vezes. Ao morrer estando forte, você entrega "Shutdowns" (Recompensas) massivos para o time inimigo. Aprenda a jogar com a vantagem: pare de forçar lutas desnecessárias 1v3 e foque em não morrer.`,
//       });
//     }

//     // 2. MECÂNICA DE ATIRADOR (Kiting e Espaçamento)
//     if (position === 'BOTTOM' && adv.kitedKills > 0) {
//       insights.push({
//         type: 'POSITIVE',
//         title: 'Mecânica Fina: Kiting',
//         description: `O algoritmo detectou ${adv.kitedKills} abates onde você utilizou Kiting (bater e recuar). Excelente controle de distanciamento (Spacing), essencial para sobreviver como atirador.`,
//       });
//     } else if (
//       position === 'BOTTOM' &&
//       metrics.deaths > 6 &&
//       metrics.advanced.damageMitigated < 10000
//     ) {
//       insights.push({
//         type: 'COACHING',
//         title: 'Problema de Posicionamento (Glass Cannon)',
//         description: `Como ADC, você é de "vidro". Ter ${metrics.deaths} mortes indica que você está se expondo muito cedo nas Team Fights. Espere os inimigos gastarem os Controles de Grupo (CC) e Ultimates antes de entrar na zona de ataque.`,
//       });
//     }

//     // 3. ANÁLISE DE UTILIDADE PURA (Suportes Enchanters / Peel)
//     if (position === 'UTILITY') {
//       if (adv.healAndShield > 10000) {
//         insights.push({
//           type: 'POSITIVE',
//           title: 'Anjo da Guarda',
//           description: `Você curou e concedeu ${adv.healAndShield.toLocaleString()} de escudo para sua equipe. Esse nível de Peel (proteção) foi o fator invisível que venceu as Team Fights.`,
//         });
//       } else if (adv.ccScore > 35) {
//         insights.push({
//           type: 'POSITIVE',
//           title: 'Controle de Grupo Absoluto',
//           description: `Seu tempo de CC foi de ${adv.ccScore} segundos. Você anulou os carregadores inimigos repetidamente com seus engages ou desengages.`,
//         });
//       } else if (metrics.assists < 10) {
//         insights.push({
//           type: 'WARNING',
//           title: 'Presença Fantasma',
//           description:
//             'Como suporte, você teve poucas assistências, baixa cura/escudo e baixo CC. Você precisa estar mais ativo nas rotações do Jungler e nas lutas do Mid.',
//         });
//       }
//     }

//     // 4. A MURALHA (Frontliners que absorvem o jogo)
//     if (isFrontline && adv.damageMitigated > 35000 && metrics.deaths <= 5) {
//       insights.push({
//         type: 'POSITIVE',
//         title: 'A Muralha Intransponível',
//         description: `Absurdo! Você mitigou ${adv.damageMitigated.toLocaleString()} de dano inimigo e morreu apenas ${metrics.deaths} vezes. Você absorveu todos os recursos do adversário para o seu time bater em paz.`,
//       });
//     }

//     // 5. O DITADOR DO EARLY GAME
//     if (adv.firstBloodInvolvement && adv.csBefore10Minutes >= 65) {
//       insights.push({
//         type: 'POSITIVE',
//         title: 'Early Game Perfeito',
//         description:
//           'Você participou do First Blood e dominou o farm nos primeiros 10 minutos. Você não apenas criou a vantagem, você asfixiou o oponente.',
//       });
//     }

//     // 6. ROUBO DE OBJETIVOS (Dano moral)
//     if (adv.epicMonsterSteals > 0) {
//       insights.push({
//         type: 'POSITIVE',
//         title: 'Dano Psicológico (Roubo de Objetivo)',
//         description: `Você roubou ${adv.epicMonsterSteals} monstro(s) épico(s) (Dragão/Barão). Jogadas assim destroem o mental do time inimigo e viram partidas perdidas.`,
//       });
//     }

//     // --- REGRAS BÁSICAS MANTIDAS PARA CONTEXTO ---
//     const visionPerMin = metrics.visionScore / duration;

//     if (position === 'UTILITY') {
//       if (visionPerMin < 1.5) {
//         insights.push({
//           type: 'WARNING',
//           title: 'Placar de Visão Baixo',
//           description: `Seu placar de visão foi de ${visionPerMin.toFixed(1)} por minuto. Como Suporte, sua meta mínima é 1.5/min. Ande mais pelo mapa com o Jungler para wardar.`,
//         });
//       }
//       if (adv.controlWardsPlaced < 3) {
//         insights.push({
//           type: 'CRITICAL',
//           title: 'Visão Pobre para Suporte',
//           description: `Obrigatório: Você colocou apenas ${adv.controlWardsPlaced} Pinks. Suportes precisam dominar a visão de objetivos. Compre 1 Pink sempre que voltar à base.`,
//         });
//       }
//     } else {
//       if (visionPerMin < 0.5) {
//         insights.push({
//           type: 'WARNING',
//           title: 'Escuridão no Mapa',
//           description: `Seu placar de visão (${visionPerMin.toFixed(1)}/min) está muito baixo. Use seu trinket (ward) sempre que estiver fora de recarga para evitar ganks.`,
//         });
//       }
//       if (adv.controlWardsPlaced === 0) {
//         insights.push({
//           type: 'COACHING',
//           title: 'Ajude na Visão',
//           description:
//             'Você terminou sem colocar nenhuma Control Ward (Pink). Visão não é dever apenas do suporte. Gaste 75 de gold de vez em quando para proteger sua lane.',
//         });
//       }
//     }

//     if (isCarry && adv.damagePerGold < 0.8 && metrics.damagePerMinute < 500) {
//       insights.push({
//         type: 'WARNING',
//         title: 'Recursos Desperdiçados',
//         description: `Você pegou ouro do mapa, mas converteu apenas ${adv.damagePerGold} de dano por ouro ganho. Seja mais agressivo nas lutas quando fechar seus itens core.`,
//       });
//     }

//     if (metrics.killParticipation < 40 && position !== 'TOP') {
//       insights.push({
//         type: 'NEGATIVE',
//         title: 'Jogador Isolado',
//         description: `Participação em abates de apenas ${metrics.killParticipation}%. Você está focando demais em farmar e deixando seu time lutar 4v5. Agrupe mais.`,
//       });
//     }

//     if (insights.length === 0) {
//       insights.push({
//         type: 'COACHING',
//         title: 'Estatísticas na Média',
//         description:
//           'Você fez o "arroz com feijão". Não foi o destaque mecânico da partida, mas também não afundou o time. Jogo sólido.',
//       });
//     }

//     return insights;
//   }
// }

// ################################# v5.0.0 - Análise Personalizada por Posição (Em Breve) #################################
// /* eslint-disable @typescript-eslint/no-unsafe-argument */
// /* eslint-disable @typescript-eslint/no-unsafe-return */
// /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// /* eslint-disable @typescript-eslint/no-unsafe-call */
// /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// import {
//   Injectable,
//   NotFoundException,
//   BadRequestException,
// } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { Analysis, AnalysisDocument } from './schemas/analysis.schema';
// import { MatchesService } from '../matches/matches.service';
// import { UsersService } from '../users/users.service';

// type InsightType =
//   | 'POSITIVE'
//   | 'NEGATIVE'
//   | 'WARNING'
//   | 'CRITICAL'
//   | 'COACHING';

// interface Insight {
//   type: InsightType;
//   title: string;
//   description: string;
// }

// interface MatchupStats {
//   opponentChampion: string | null;
//   goldDiff: number;
//   csDiff: number;
//   soloKills: number;
// }

// interface AdvancedMetrics {
//   damagePerGold: number;
//   teamDamagePercentage: number;
//   controlWardsPlaced: number;
//   csBefore10Minutes: number;
//   turretPlatesTaken: number;
//   timeSpentDeadPercentage: number;
//   ccScore: number;
//   damageMitigated: number;
//   healAndShield: number;
//   kitedKills: number;
//   epicMonsterSteals: number;
//   firstBloodInvolvement: boolean;
//   skillshotsDodged: number;
// }

// interface MatchMetrics {
//   kills: number;
//   deaths: number;
//   assists: number;
//   csPerMin: number;
//   visionScore: number;
//   killParticipation: number;
//   damagePerMinute: number;
//   objectiveDamage: number;
//   matchup: MatchupStats;
//   advanced: AdvancedMetrics;
// }

// @Injectable()
// export class AnalyzerService {
//   constructor(
//     @InjectModel(Analysis.name) private analysisModel: Model<AnalysisDocument>,
//     private matchesService: MatchesService,
//     private usersService: UsersService,
//   ) {}

//   async analyzeMatchForUser(userId: string, matchId: string) {
//     // RESOLVIDO PONTO 2: Deleta a análise antiga se existir para forçar a recriação
//     const existingAnalysis = await this.analysisModel
//       .findOne({ userId, matchId })
//       .exec();
//     if (existingAnalysis) {
//       await this.analysisModel.deleteOne({ _id: existingAnalysis._id });
//     }

//     const user = await this.usersService.findById(userId);
//     const match = await this.matchesService.findByMatchId(matchId);

//     if (!user || !user.riotAccount)
//       throw new NotFoundException('Conta Riot não vinculada.');
//     if (!match)
//       throw new NotFoundException(
//         'Partida não encontrada no banco. Sincronize primeiro.',
//       );

//     const puuid = user.riotAccount.puuid;
//     const participant = match.info.participants.find(
//       (p: any) => p.puuid === puuid,
//     );
//     if (!participant)
//       throw new BadRequestException('O usuário não jogou esta partida.');

//     const teamId = participant.teamId;
//     const teamKills = match.info.participants
//       .filter((p: any) => p.teamId === teamId)
//       .reduce((acc: number, p: any) => acc + p.kills, 0);

//     const gameDurationMinutes = match.gameDuration / 60;
//     const challenges = participant.challenges || {};

//     const totalCs =
//       participant.totalMinionsKilled + participant.neutralMinionsKilled;
//     const csPerMin = totalCs / gameDurationMinutes;
//     const killParticipation =
//       teamKills > 0
//         ? ((participant.kills + participant.assists) / teamKills) * 100
//         : 0;
//     const damagePerMinute =
//       participant.totalDamageDealtToChampions / gameDurationMinutes;
//     const damagePerGold =
//       participant.goldEarned > 0
//         ? participant.totalDamageDealtToChampions / participant.goldEarned
//         : 0;
//     const timeSpentDeadPercentage =
//       (participant.totalTimeSpentDead / match.gameDuration) * 100;

//     const position = participant.teamPosition;
//     const opponent = match.info.participants.find(
//       (p: any) => p.teamId !== teamId && p.teamPosition === position,
//     );

//     let matchupStats: MatchupStats = {
//       opponentChampion: null,
//       goldDiff: 0,
//       csDiff: 0,
//       soloKills: challenges.soloKills || 0,
//     };
//     if (opponent) {
//       const opponentCs =
//         opponent.totalMinionsKilled + opponent.neutralMinionsKilled;
//       matchupStats = {
//         opponentChampion: opponent.championName,
//         goldDiff: participant.goldEarned - opponent.goldEarned,
//         csDiff: totalCs - opponentCs,
//         soloKills: challenges.soloKills || 0,
//       };
//     }

//     const metrics: MatchMetrics = {
//       kills: participant.kills,
//       deaths: participant.deaths,
//       assists: participant.assists,
//       csPerMin: Number(csPerMin.toFixed(1)),
//       visionScore: participant.visionScore,
//       killParticipation: Number(killParticipation.toFixed(1)),
//       damagePerMinute: Number(damagePerMinute.toFixed(0)),
//       objectiveDamage: participant.damageDealtToObjectives,
//       matchup: matchupStats,
//       advanced: {
//         damagePerGold: Number(damagePerGold.toFixed(2)),
//         teamDamagePercentage: Number(
//           (challenges.teamDamagePercentage || 0) * 100,
//         ).toFixed(1) as unknown as number,
//         controlWardsPlaced:
//           challenges.controlWardsPlaced ||
//           participant.visionWardsBoughtInGame ||
//           0,
//         csBefore10Minutes: challenges.laneMinionsFirst10Minutes || 0,
//         turretPlatesTaken: challenges.turretPlatesTaken || 0,
//         timeSpentDeadPercentage: Number(timeSpentDeadPercentage.toFixed(1)),
//         ccScore: participant.timeCCingOthers || 0,
//         damageMitigated: participant.damageSelfMitigated || 0,
//         healAndShield:
//           (participant.totalHealsOnTeammates || 0) +
//           (participant.totalDamageShieldedOnTeammates || 0),
//         kitedKills: challenges.kitedKills || 0,
//         epicMonsterSteals: challenges.epicMonsterSteals || 0,
//         firstBloodInvolvement:
//           participant.firstBloodKill || participant.firstBloodAssist || false,
//         skillshotsDodged: challenges.skillshotsDodged || 0,
//       },
//     };

//     const insights = this.generateInsights(
//       metrics,
//       position,
//       gameDurationMinutes,
//     );

//     const newAnalysis = new this.analysisModel({
//       userId,
//       matchId,
//       championName: participant.championName,
//       win: participant.win,
//       metrics,
//       insights,
//     });

//     return newAnalysis.save();
//   }

//   // RESOLVIDO PONTO 1: Análise forçada em 5 Pilares (Sempre haverá 5 insights no mínimo)
//   private generateInsights(
//     metrics: MatchMetrics,
//     position: string,
//     duration: number,
//   ): Insight[] {
//     const insights: Insight[] = [];
//     const adv = metrics.advanced;
//     const isCarry = ['MIDDLE', 'BOTTOM'].includes(position);
//     const isFrontline = ['TOP', 'JUNGLE'].includes(position);

//     // PILAR 1: ECONOMIA E FARM
//     if (position !== 'UTILITY' && position !== 'JUNGLE') {
//       if (adv.csBefore10Minutes < 60) {
//         insights.push({
//           type: 'NEGATIVE',
//           title: 'Early Game Fraco (Farm)',
//           description: `Você farmou apenas ${adv.csBefore10Minutes} tropas nos primeiros 10 minutos. O ideal é 70+. Perca menos ondas de tropas.`,
//         });
//       } else if (metrics.csPerMin > 7.5) {
//         insights.push({
//           type: 'POSITIVE',
//           title: 'Economia de Alto Nível',
//           description: `Você manteve um farm excelente (${metrics.csPerMin} CS/min). Isso garantiu seu pico de poder rápido.`,
//         });
//       } else {
//         insights.push({
//           type: 'COACHING',
//           title: 'Economia Estável',
//           description: `Seu farm foi de ${metrics.csPerMin} CS/min. Está dentro da média, mas focar em pegar rotas laterais no mid-game pode elevar seu nível.`,
//         });
//       }
//     }

//     // PILAR 2: COMBATE E PRESENÇA (KDA / KP)
//     if (metrics.kills >= 10 && metrics.deaths >= 8) {
//       insights.push({
//         type: 'CRITICAL',
//         title: 'Jogando no Cara ou Coroa (Throws)',
//         description: `Você pegou ${metrics.kills} abates, mas morreu ${metrics.deaths} vezes. Ao morrer estando forte, você entrega recompensas massivas ao inimigo. Pare de forçar lutas desnecessárias.`,
//       });
//     } else if (metrics.killParticipation < 40 && position !== 'TOP') {
//       insights.push({
//         type: 'NEGATIVE',
//         title: 'Jogador Isolado',
//         description: `Sua participação em abates foi de apenas ${metrics.killParticipation}%. Você está focando demais em farmar e deixando seu time lutar em desvantagem.`,
//       });
//     } else if (adv.timeSpentDeadPercentage > 12) {
//       insights.push({
//         type: 'CRITICAL',
//         title: 'Excesso de Tempo Morto',
//         description: `Você passou ${adv.timeSpentDeadPercentage}% da partida inteira com a tela cinza. Valorize mais sua vida.`,
//       });
//     } else {
//       insights.push({
//         type: 'POSITIVE',
//         title: 'Presença de Combate Sólida',
//         description: `Boa participação em lutas (${metrics.killParticipation}% KP) e mortes controladas. Você ajudou o time sem se expor desnecessariamente.`,
//       });
//     }

//     // PILAR 3: EFICIÊNCIA DE FUNÇÃO (Damage / Tank / Utility)
//     if (isCarry) {
//       if (adv.damagePerGold < 0.8 && metrics.damagePerMinute < 500) {
//         insights.push({
//           type: 'WARNING',
//           title: 'Recursos Desperdiçados',
//           description: `Você absorveu ouro, mas converteu apenas ${adv.damagePerGold} de dano por ouro ganho. Seja mais agressivo nas lutas.`,
//         });
//       } else if (adv.teamDamagePercentage > 30) {
//         insights.push({
//           type: 'POSITIVE',
//           title: 'Máquina de Dano',
//           description: `Você causou ${adv.teamDamagePercentage}% de todo o dano do seu time. Verdadeiro carregador da partida.`,
//         });
//       } else {
//         insights.push({
//           type: 'COACHING',
//           title: 'Dano na Média',
//           description: `Você causou ${metrics.damagePerMinute} Dano Por Minuto. Cumpriu seu papel, mas procure oportunidades seguras de dar mais "poke" antes das lutas começarem.`,
//         });
//       }
//     } else if (isFrontline) {
//       if (adv.damageMitigated > 35000) {
//         insights.push({
//           type: 'POSITIVE',
//           title: 'A Muralha',
//           description: `Você mitigou ${adv.damageMitigated.toLocaleString()} de dano. Absorveu todos os recursos do adversário para o seu time bater em paz.`,
//         });
//       } else {
//         insights.push({
//           type: 'COACHING',
//           title: 'Absorção de Dano',
//           description: `Você mitigou ${adv.damageMitigated.toLocaleString()} de dano. Busque se posicionar sempre à frente dos seus carregadores para protegê-los melhor.`,
//         });
//       }
//     } else if (position === 'UTILITY') {
//       if (adv.healAndShield > 10000 || adv.ccScore > 35) {
//         insights.push({
//           type: 'POSITIVE',
//           title: 'Suporte de Impacto',
//           description: `Excelente proteção ao time! Você curou/escudou muito ou aplicou controle de grupo no momento certo.`,
//         });
//       } else {
//         insights.push({
//           type: 'COACHING',
//           title: 'Utilidade Padrão',
//           description: `Você cumpriu sua função de suporte sem se destacar muito em cura ou controles de grupo. Tente focar suas habilidades defensivas no jogador mais forte do seu time.`,
//         });
//       }
//     }

//     // PILAR 4: CONTROLE DE VISÃO
//     const visionPerMin = metrics.visionScore / duration;
//     if (position === 'UTILITY') {
//       if (visionPerMin < 1.5 || adv.controlWardsPlaced < 3) {
//         insights.push({
//           type: 'CRITICAL',
//           title: 'Visão Pobre (Suporte)',
//           description: `Você wardou mal ou comprou menos de 3 Pinks. Suportes precisam dominar a visão de objetivos. Compre 1 Pink sempre que base.`,
//         });
//       } else {
//         insights.push({
//           type: 'POSITIVE',
//           title: 'Controle de Mapa Excelente',
//           description: `Ótimo placar de visão (${visionPerMin.toFixed(1)}/min) e uso de Pinks. Você iluminou o mapa para sua equipe.`,
//         });
//       }
//     } else {
//       if (visionPerMin < 0.5 || adv.controlWardsPlaced === 0) {
//         insights.push({
//           type: 'WARNING',
//           title: 'Ajude na Visão',
//           description: `Seu placar de visão está baixo (${visionPerMin.toFixed(1)}/min) e faltaram Pinks. Visão não é dever apenas do suporte.`,
//         });
//       } else {
//         insights.push({
//           type: 'COACHING',
//           title: 'Visão Adequada',
//           description: `Sua contribuição com visão foi satisfatória para a sua rota. Continue sempre usando os trinkets para evitar ganks isolados.`,
//         });
//       }
//     }

//     // PILAR 5: MATCHUP (1V1 DA ROTA)
//     if (metrics.matchup.opponentChampion) {
//       const opName = metrics.matchup.opponentChampion;
//       if (metrics.matchup.goldDiff > 1000 && metrics.matchup.csDiff > 15) {
//         insights.push({
//           type: 'POSITIVE',
//           title: `Dominou a Rota`,
//           description: `Você destruiu o(a) ${opName}, terminando com ${metrics.matchup.goldDiff} de Ouro e ${metrics.matchup.csDiff} de farm a mais.`,
//         });
//       } else if (
//         metrics.matchup.goldDiff < -1000 &&
//         metrics.matchup.csDiff < -15
//       ) {
//         insights.push({
//           type: 'NEGATIVE',
//           title: `Sufoco na Rota`,
//           description: `Você sofreu contra o(a) ${opName}, ficando para trás em ouro e farm. Jogue mais recuado em matchups ruins.`,
//         });
//       } else {
//         insights.push({
//           type: 'COACHING',
//           title: `Rota Equilibrada`,
//           description: `O duelo contra o(a) ${opName} foi muito parelho. Ouro e farm ficaram muito próximos, sem um vencedor claro na fase de rotas.`,
//         });
//       }
//     }

//     return insights;
//   }
// }

// ############################ v6.0.0 - Análise Personalizada por Posição + Insights 5x Analíticos (Em Breve) ############################
// /* eslint-disable @typescript-eslint/no-unsafe-argument */
// /* eslint-disable @typescript-eslint/no-unsafe-return */
// /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// /* eslint-disable @typescript-eslint/no-unsafe-call */
// /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// import {
//   Injectable,
//   NotFoundException,
//   BadRequestException,
// } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { Analysis, AnalysisDocument } from './schemas/analysis.schema';
// import { MatchesService } from '../matches/matches.service';
// import { UsersService } from '../users/users.service';

// type InsightType =
//   | 'POSITIVE'
//   | 'NEGATIVE'
//   | 'WARNING'
//   | 'CRITICAL'
//   | 'COACHING';

// interface Insight {
//   type: InsightType;
//   title: string;
//   description: string;
// }

// interface MatchupStats {
//   opponentChampion: string | null;
//   goldDiff: number;
//   csDiff: number;
//   soloKills: number;
// }

// interface AdvancedMetrics {
//   damagePerGold: number;
//   teamDamagePercentage: number;
//   controlWardsPlaced: number;
//   csBefore10Minutes: number;
//   turretPlatesTaken: number;
//   timeSpentDeadPercentage: number;
//   ccScore: number;
//   damageMitigated: number;
//   healAndShield: number;
//   kitedKills: number;
//   epicMonsterSteals: number;
//   firstBloodInvolvement: boolean;
//   skillshotsDodged: number;
// }

// interface MatchMetrics {
//   kills: number;
//   deaths: number;
//   assists: number;
//   csPerMin: number;
//   visionScore: number;
//   killParticipation: number;
//   damagePerMinute: number;
//   objectiveDamage: number;
//   matchup: MatchupStats;
//   advanced: AdvancedMetrics;
// }

// @Injectable()
// export class AnalyzerService {
//   constructor(
//     @InjectModel(Analysis.name) private analysisModel: Model<AnalysisDocument>,
//     private matchesService: MatchesService,
//     private usersService: UsersService,
//   ) {}

//   async analyzeMatchForUser(userId: string, matchId: string) {
//     // 1. Deleta a análise antiga se existir para forçar a recriação
//     const existingAnalysis = await this.analysisModel
//       .findOne({ userId, matchId })
//       .exec();
//     if (existingAnalysis) {
//       await this.analysisModel.deleteOne({ _id: existingAnalysis._id });
//     }

//     // 2. Busca Usuário e Partida
//     const user = await this.usersService.findById(userId);
//     const match = await this.matchesService.findByMatchId(matchId);

//     if (!user || !user.riotAccount)
//       throw new NotFoundException('Conta Riot não vinculada.');
//     if (!match)
//       throw new NotFoundException(
//         'Partida não encontrada no banco. Sincronize primeiro.',
//       );

//     // 3. PROTEÇÃO CONTRA REMAKE (Jogos menores que 5 minutos)
//     if (match.gameDuration < 300) {
//       throw new BadRequestException(
//         'Partida muito curta (Remake). Não há dados suficientes para uma análise precisa.',
//       );
//     }

//     const puuid = user.riotAccount.puuid;
//     const participant = match.info.participants.find(
//       (p: any) => p.puuid === puuid,
//     );
//     if (!participant)
//       throw new BadRequestException('O usuário não jogou esta partida.');

//     const teamId = participant.teamId;
//     const teamKills = match.info.participants
//       .filter((p: any) => p.teamId === teamId)
//       .reduce((acc: number, p: any) => acc + p.kills, 0);

//     const gameDurationMinutes = match.gameDuration / 60;
//     const challenges = participant.challenges || {};

//     const totalCs =
//       participant.totalMinionsKilled + participant.neutralMinionsKilled;
//     const csPerMin = totalCs / gameDurationMinutes;
//     const killParticipation =
//       teamKills > 0
//         ? ((participant.kills + participant.assists) / teamKills) * 100
//         : 0;
//     const damagePerMinute =
//       participant.totalDamageDealtToChampions / gameDurationMinutes;
//     const damagePerGold =
//       participant.goldEarned > 0
//         ? participant.totalDamageDealtToChampions / participant.goldEarned
//         : 0;
//     const timeSpentDeadPercentage =
//       (participant.totalTimeSpentDead / match.gameDuration) * 100;

//     const position = participant.teamPosition; // TOP, JUNGLE, MIDDLE, BOTTOM, UTILITY
//     const opponent = match.info.participants.find(
//       (p: any) => p.teamId !== teamId && p.teamPosition === position,
//     );

//     let matchupStats: MatchupStats = {
//       opponentChampion: null,
//       goldDiff: 0,
//       csDiff: 0,
//       soloKills: challenges.soloKills || 0,
//     };
//     if (opponent) {
//       const opponentCs =
//         opponent.totalMinionsKilled + opponent.neutralMinionsKilled;
//       matchupStats = {
//         opponentChampion: opponent.championName,
//         goldDiff: participant.goldEarned - opponent.goldEarned,
//         csDiff: totalCs - opponentCs,
//         soloKills: challenges.soloKills || 0,
//       };
//     }

//     const metrics: MatchMetrics = {
//       kills: participant.kills,
//       deaths: participant.deaths,
//       assists: participant.assists,
//       csPerMin: Number(csPerMin.toFixed(1)),
//       visionScore: participant.visionScore,
//       killParticipation: Number(killParticipation.toFixed(1)),
//       damagePerMinute: Number(damagePerMinute.toFixed(0)),
//       objectiveDamage: participant.damageDealtToObjectives,
//       matchup: matchupStats,
//       advanced: {
//         damagePerGold: Number(damagePerGold.toFixed(2)),
//         // FIX TYPESCRIPT: Correção na conversão de string para number do toFixed
//         teamDamagePercentage: Number(
//           ((challenges.teamDamagePercentage || 0) * 100).toFixed(1),
//         ),
//         controlWardsPlaced:
//           challenges.controlWardsPlaced ||
//           participant.visionWardsBoughtInGame ||
//           0,
//         csBefore10Minutes: challenges.laneMinionsFirst10Minutes || 0,
//         turretPlatesTaken: challenges.turretPlatesTaken || 0,
//         timeSpentDeadPercentage: Number(timeSpentDeadPercentage.toFixed(1)),
//         ccScore: participant.timeCCingOthers || 0,
//         damageMitigated: participant.damageSelfMitigated || 0,
//         healAndShield:
//           (participant.totalHealsOnTeammates || 0) +
//           (participant.totalDamageShieldedOnTeammates || 0),
//         kitedKills: challenges.kitedKills || 0,
//         epicMonsterSteals: challenges.epicMonsterSteals || 0,
//         firstBloodInvolvement:
//           participant.firstBloodKill || participant.firstBloodAssist || false,
//         skillshotsDodged: challenges.skillshotsDodged || 0,
//       },
//     };

//     const insights = this.generateInsights(
//       metrics,
//       position,
//       gameDurationMinutes,
//     );

//     const newAnalysis = new this.analysisModel({
//       userId,
//       matchId,
//       championName: participant.championName,
//       win: participant.win,
//       metrics,
//       insights,
//     });

//     return newAnalysis.save();
//   }

//   // RESOLVIDO PONTO 1: Análise forçada em 5 Pilares (Sempre haverá 5 insights no mínimo)
//   private generateInsights(
//     metrics: MatchMetrics,
//     position: string,
//     duration: number,
//   ): Insight[] {
//     const insights: Insight[] = [];
//     const adv = metrics.advanced;
//     const isCarry = ['MIDDLE', 'BOTTOM'].includes(position);
//     const isFrontline = ['TOP'].includes(position);

//     // PILAR 1: ECONOMIA E MACRO (FARM E BARRICADAS 2026)
//     if (position !== 'UTILITY' && position !== 'JUNGLE') {
//       if (adv.turretPlatesTaken >= 6) {
//         // Meta 2026: Split pushers e dominadores de mapa
//         insights.push({
//           type: 'POSITIVE',
//           title: 'Rei do Macro (Barricadas)',
//           description: `Você destruiu incríveis ${adv.turretPlatesTaken} barricadas durante o jogo. Como elas agora duram a partida toda, sua pressão constante nas torres gerou uma vantagem de ouro massiva para você e sua equipe.`,
//         });
//       } else if (adv.csBefore10Minutes < 60) {
//         insights.push({
//           type: 'NEGATIVE',
//           title: 'Early Game Fraco (Farm)',
//           description: `Você farmou apenas ${adv.csBefore10Minutes} tropas nos primeiros 10 minutos. O ideal é 70+. Perca menos ondas de tropas no início para acelerar seus itens.`,
//         });
//       } else if (metrics.csPerMin > 7.5) {
//         insights.push({
//           type: 'POSITIVE',
//           title: 'Economia de Alto Nível',
//           description: `Você manteve um farm excelente (${metrics.csPerMin} CS/min) e levou ${adv.turretPlatesTaken} barricadas globais. Isso garantiu seu pico de poder muito rápido.`,
//         });
//       } else {
//         insights.push({
//           type: 'COACHING',
//           title: 'Economia Estável',
//           description: `Seu farm foi de ${metrics.csPerMin} CS/min e você coletou ${adv.turretPlatesTaken} barricadas. Está na média, mas melhorar as rotações laterais no mid-game trará mais ouro constante.`,
//         });
//       }
//     } else {
//       // Suporte e Jungler
//       if (adv.turretPlatesTaken >= 4) {
//         insights.push({
//           type: 'POSITIVE',
//           title: 'Pressão de Mapa (Barricadas)',
//           description: `Mesmo na sua função, você ajudou a derrubar ${adv.turretPlatesTaken} barricadas globais, injetando um ótimo ouro extra no time durante a partida.`,
//         });
//       } else {
//         insights.push({
//           type: 'COACHING',
//           title: 'Economia Baseada em Mapa',
//           description: `Na sua função, o farm não é a prioridade primária. Foque em manter presença no mapa e distribuir vantagens (Kills e Barricadas) para seus carregadores.`,
//         });
//       }
//     }

//     // PILAR 2: COMBATE E PRESENÇA (KDA / KP)
//     if (metrics.kills >= 10 && metrics.deaths >= 8) {
//       insights.push({
//         type: 'CRITICAL',
//         title: 'Jogando no Cara ou Coroa (Throws)',
//         description: `Você pegou ${metrics.kills} abates, mas morreu ${metrics.deaths} vezes. Ao morrer estando forte, você entrega recompensas massivas ao inimigo. Pare de forçar lutas desnecessárias.`,
//       });
//     } else if (metrics.killParticipation < 40 && position !== 'TOP') {
//       insights.push({
//         type: 'NEGATIVE',
//         title: 'Jogador Isolado',
//         description: `Sua participação em abates foi de apenas ${metrics.killParticipation}%. Você está focando demais no seu próprio jogo e deixando seu time lutar em desvantagem numérica.`,
//       });
//     } else if (adv.timeSpentDeadPercentage > 12) {
//       insights.push({
//         type: 'CRITICAL',
//         title: 'Excesso de Tempo Morto',
//         description: `Você passou ${adv.timeSpentDeadPercentage}% da partida inteira com a tela cinza. Valorize mais sua vida para não deixar o mapa aberto.`,
//       });
//     } else {
//       insights.push({
//         type: 'POSITIVE',
//         title: 'Presença de Combate Sólida',
//         description: `Boa participação em lutas (${metrics.killParticipation}% KP) e mortes controladas. Você ajudou o time sem se expor desnecessariamente.`,
//       });
//     }

//     // PILAR 3: EFICIÊNCIA DE FUNÇÃO (Damage / Tank / Utility / JUNGLE FIX)
//     if (position === 'JUNGLE') {
//       if (metrics.objectiveDamage > 20000) {
//         insights.push({
//           type: 'POSITIVE',
//           title: 'Controle de Objetivos',
//           description: `Você causou incríveis ${metrics.objectiveDamage.toLocaleString()} de dano em objetivos. Dominou Dragões e Torres impecavelmente.`,
//         });
//       } else if (metrics.objectiveDamage < 8000) {
//         insights.push({
//           type: 'WARNING',
//           title: 'Abandono de Objetivos',
//           description: `Seu dano em objetivos foi de apenas ${metrics.objectiveDamage.toLocaleString()}. O Jungler precisa liderar as chamadas de Dragão e Barão.`,
//         });
//       } else {
//         insights.push({
//           type: 'COACHING',
//           title: 'Objetivos na Média',
//           description: `Você ajudou nos objetivos (${metrics.objectiveDamage.toLocaleString()} de dano), mas tente criar ainda mais pressão na selva inimiga com o seu time.`,
//         });
//       }
//     } else if (isCarry) {
//       if (adv.damagePerGold < 0.8 && metrics.damagePerMinute < 500) {
//         insights.push({
//           type: 'WARNING',
//           title: 'Recursos Desperdiçados',
//           description: `Você absorveu ouro, mas converteu apenas ${adv.damagePerGold} de dano por ouro ganho. Seja mais agressivo nas lutas quando tiver seus itens.`,
//         });
//       } else if (adv.teamDamagePercentage > 30) {
//         insights.push({
//           type: 'POSITIVE',
//           title: 'Máquina de Dano',
//           description: `Você causou ${adv.teamDamagePercentage}% de todo o dano do seu time. Verdadeiro carregador da partida.`,
//         });
//       } else {
//         insights.push({
//           type: 'COACHING',
//           title: 'Dano na Média',
//           description: `Você causou ${metrics.damagePerMinute} Dano Por Minuto. Cumpriu seu papel, mas procure oportunidades seguras de dar mais "poke" antes das lutas.`,
//         });
//       }
//     } else if (isFrontline) {
//       if (adv.damageMitigated > 35000) {
//         insights.push({
//           type: 'POSITIVE',
//           title: 'A Muralha',
//           description: `Você mitigou ${adv.damageMitigated.toLocaleString()} de dano. Absorveu todos os recursos do adversário para o seu time bater em paz.`,
//         });
//       } else {
//         insights.push({
//           type: 'COACHING',
//           title: 'Absorção de Dano',
//           description: `Você mitigou ${adv.damageMitigated.toLocaleString()} de dano. Busque se posicionar sempre à frente dos seus carregadores para protegê-los melhor.`,
//         });
//       }
//     } else if (position === 'UTILITY') {
//       if (adv.healAndShield > 10000 || adv.ccScore > 35) {
//         insights.push({
//           type: 'POSITIVE',
//           title: 'Suporte de Impacto',
//           description: `Excelente proteção ao time! Você curou/escudou muito ou aplicou controle de grupo no momento certo.`,
//         });
//       } else {
//         insights.push({
//           type: 'COACHING',
//           title: 'Utilidade Padrão',
//           description: `Você cumpriu sua função sem se destacar absurdamente em cura ou CC. Tente focar suas habilidades defensivas no jogador mais forte do time.`,
//         });
//       }
//     }

//     // PILAR 4: CONTROLE DE VISÃO
//     const visionPerMin = metrics.visionScore / duration;
//     if (position === 'UTILITY') {
//       if (visionPerMin < 1.5 || adv.controlWardsPlaced < 3) {
//         insights.push({
//           type: 'CRITICAL',
//           title: 'Visão Pobre (Suporte)',
//           description: `Você wardou mal ou comprou menos de 3 Pinks. Suportes precisam dominar a visão de objetivos. Compre 1 Pink sempre que for base.`,
//         });
//       } else {
//         insights.push({
//           type: 'POSITIVE',
//           title: 'Controle de Mapa Excelente',
//           description: `Ótimo placar de visão (${visionPerMin.toFixed(1)}/min) e uso de Pinks. Você iluminou o mapa para sua equipe.`,
//         });
//       }
//     } else {
//       if (visionPerMin < 0.5 || adv.controlWardsPlaced === 0) {
//         insights.push({
//           type: 'WARNING',
//           title: 'Ajude na Visão',
//           description: `Seu placar de visão está baixo (${visionPerMin.toFixed(1)}/min) e faltaram Pinks. Visão não é dever apenas do suporte.`,
//         });
//       } else {
//         insights.push({
//           type: 'COACHING',
//           title: 'Visão Adequada',
//           description: `Sua contribuição com visão foi satisfatória. Continue usando os trinkets em locais estratégicos para evitar ganks isolados.`,
//         });
//       }
//     }

//     // PILAR 5: MATCHUP (1V1 DA ROTA)
//     if (metrics.matchup.opponentChampion) {
//       const opName = metrics.matchup.opponentChampion;
//       if (metrics.matchup.goldDiff > 1000 && metrics.matchup.csDiff > 15) {
//         insights.push({
//           type: 'POSITIVE',
//           title: `Dominou a Rota`,
//           description: `Você destruiu o(a) ${opName}, terminando com ${metrics.matchup.goldDiff} de Ouro e ${metrics.matchup.csDiff} de farm a mais.`,
//         });
//       } else if (
//         metrics.matchup.goldDiff < -1000 &&
//         metrics.matchup.csDiff < -15
//       ) {
//         insights.push({
//           type: 'NEGATIVE',
//           title: `Sufoco na Rota`,
//           description: `Você sofreu contra o(a) ${opName}, ficando para trás em ouro e farm. Jogue mais recuado em matchups difíceis para não feedar o oponente.`,
//         });
//       } else {
//         insights.push({
//           type: 'COACHING',
//           title: `Rota Equilibrada`,
//           description: `O duelo contra o(a) ${opName} foi muito parelho. Ouro e farm ficaram muito próximos, sem um vencedor claro. Em jogos assim, a team fight decide tudo.`,
//         });
//       }
//     } else {
//       insights.push({
//         type: 'COACHING',
//         title: `Partida Atípica`,
//         description: `Não conseguimos encontrar um oponente direto na sua rota para comparar. Foco nas suas estatísticas macro.`,
//       });
//     }

//     return insights;
//   }
// }

// ############################ v7.0.0 - Análise Personalizada por Posição + Insights 5x Analíticos + Recomendações de Treino (Em Breve) ############################
// /* eslint-disable @typescript-eslint/no-unsafe-argument */
// /* eslint-disable @typescript-eslint/no-unsafe-return */
// /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// /* eslint-disable @typescript-eslint/no-unsafe-call */
// /* eslint-disable @typescript-eslint/no-unsafe-member-access */

// import {
//   Injectable,
//   NotFoundException,
//   BadRequestException,
// } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { Analysis, AnalysisDocument } from './schemas/analysis.schema';
// import { MatchesService } from '../matches/matches.service';
// import { UsersService } from '../users/users.service';

// type InsightType =
//   | 'POSITIVE'
//   | 'NEGATIVE'
//   | 'WARNING'
//   | 'CRITICAL'
//   | 'COACHING';

// interface Insight {
//   type: InsightType;
//   title: string;
//   description: string;
// }

// interface MatchupStats {
//   opponentChampion: string | null;
//   goldDiff: number;
//   csDiff: number;
//   soloKills: number;
// }

// interface TeamMetrics {
//   totalKills: number;
//   totalDeaths: number;
//   totalGold: number;
//   totalDamage: number;
//   isWin: boolean;
// }

// interface AdvancedMetrics {
//   damagePerGold: number;
//   teamDamagePercentage: number;
//   controlWardsPlaced: number;
//   csBefore10Minutes: number;
//   turretPlatesTaken: number;
//   timeSpentDeadPercentage: number;
//   ccScore: number;
//   damageMitigated: number;
//   healAndShield: number;
//   kitedKills: number;
//   epicMonsterSteals: number;
//   firstBloodInvolvement: boolean;
//   skillshotsDodged: number;
// }

// interface MatchMetrics {
//   kills: number;
//   deaths: number;
//   assists: number;
//   csPerMin: number;
//   visionScore: number;
//   killParticipation: number;
//   damagePerMinute: number;
//   objectiveDamage: number;
//   matchup: MatchupStats;
//   advanced: AdvancedMetrics;
//   team: TeamMetrics; // ADICIONAMOS OS STATUS GERAIS DO TIME AQUI!
// }

// @Injectable()
// export class AnalyzerService {
//   constructor(
//     @InjectModel(Analysis.name) private analysisModel: Model<AnalysisDocument>,
//     private matchesService: MatchesService,
//     private usersService: UsersService,
//   ) {}

//   async analyzeMatchForUser(userId: string, matchId: string) {
//     const existingAnalysis = await this.analysisModel
//       .findOne({ userId, matchId })
//       .exec();
//     if (existingAnalysis) {
//       await this.analysisModel.deleteOne({ _id: existingAnalysis._id });
//     }

//     const user = await this.usersService.findById(userId);
//     const match = await this.matchesService.findByMatchId(matchId);

//     if (!user || !user.riotAccount)
//       throw new NotFoundException('Conta Riot não vinculada.');
//     if (!match)
//       throw new NotFoundException(
//         'Partida não encontrada no banco. Sincronize primeiro.',
//       );

//     if (match.gameDuration < 300) {
//       throw new BadRequestException(
//         'Partida muito curta (Remake). Não há dados suficientes para análise.',
//       );
//     }

//     const puuid = user.riotAccount.puuid;
//     const participant = match.info.participants.find(
//       (p: any) => p.puuid === puuid,
//     );
//     if (!participant)
//       throw new BadRequestException('O usuário não jogou esta partida.');

//     const teamId = participant.teamId;
//     const teamMates = match.info.participants.filter(
//       (p: any) => p.teamId === teamId,
//     );

//     // CÁLCULO GERAL DA EQUIPE (Para descobrir quem afundou quem)
//     const teamTotalKills = teamMates.reduce(
//       (acc: number, p: any) => acc + p.kills,
//       0,
//     );
//     const teamTotalDeaths = teamMates.reduce(
//       (acc: number, p: any) => acc + p.deaths,
//       0,
//     );
//     const teamTotalGold = teamMates.reduce(
//       (acc: number, p: any) => acc + p.goldEarned,
//       0,
//     );
//     const teamTotalDamage = teamMates.reduce(
//       (acc: number, p: any) => acc + p.totalDamageDealtToChampions,
//       0,
//     );

//     const gameDurationMinutes = match.gameDuration / 60;
//     const challenges = participant.challenges || {};

//     const totalCs =
//       participant.totalMinionsKilled + participant.neutralMinionsKilled;
//     const csPerMin = totalCs / gameDurationMinutes;
//     const killParticipation =
//       teamTotalKills > 0
//         ? ((participant.kills + participant.assists) / teamTotalKills) * 100
//         : 0;
//     const damagePerMinute =
//       participant.totalDamageDealtToChampions / gameDurationMinutes;
//     const damagePerGold =
//       participant.goldEarned > 0
//         ? participant.totalDamageDealtToChampions / participant.goldEarned
//         : 0;
//     const timeSpentDeadPercentage =
//       (participant.totalTimeSpentDead / match.gameDuration) * 100;

//     const position = participant.teamPosition;
//     const opponent = match.info.participants.find(
//       (p: any) => p.teamId !== teamId && p.teamPosition === position,
//     );

//     let matchupStats: MatchupStats = {
//       opponentChampion: null,
//       goldDiff: 0,
//       csDiff: 0,
//       soloKills: challenges.soloKills || 0,
//     };
//     if (opponent) {
//       const opponentCs =
//         opponent.totalMinionsKilled + opponent.neutralMinionsKilled;
//       matchupStats = {
//         opponentChampion: opponent.championName,
//         goldDiff: participant.goldEarned - opponent.goldEarned,
//         csDiff: totalCs - opponentCs,
//         soloKills: challenges.soloKills || 0,
//       };
//     }

//     const metrics: MatchMetrics = {
//       kills: participant.kills,
//       deaths: participant.deaths,
//       assists: participant.assists,
//       csPerMin: Number(csPerMin.toFixed(1)),
//       visionScore: participant.visionScore,
//       killParticipation: Number(killParticipation.toFixed(1)),
//       damagePerMinute: Number(damagePerMinute.toFixed(0)),
//       objectiveDamage: participant.damageDealtToObjectives,
//       matchup: matchupStats,
//       team: {
//         totalKills: teamTotalKills,
//         totalDeaths: teamTotalDeaths,
//         totalGold: teamTotalGold,
//         totalDamage: teamTotalDamage,
//         isWin: participant.win,
//       },
//       advanced: {
//         damagePerGold: Number(damagePerGold.toFixed(2)),
//         teamDamagePercentage: Number(
//           ((challenges.teamDamagePercentage || 0) * 100).toFixed(1),
//         ),
//         controlWardsPlaced:
//           challenges.controlWardsPlaced ||
//           participant.visionWardsBoughtInGame ||
//           0,
//         csBefore10Minutes: challenges.laneMinionsFirst10Minutes || 0,
//         turretPlatesTaken: challenges.turretPlatesTaken || 0,
//         timeSpentDeadPercentage: Number(timeSpentDeadPercentage.toFixed(1)),
//         ccScore: participant.timeCCingOthers || 0,
//         damageMitigated: participant.damageSelfMitigated || 0,
//         healAndShield:
//           (participant.totalHealsOnTeammates || 0) +
//           (participant.totalDamageShieldedOnTeammates || 0),
//         kitedKills: challenges.kitedKills || 0,
//         epicMonsterSteals: challenges.epicMonsterSteals || 0,
//         firstBloodInvolvement:
//           participant.firstBloodKill || participant.firstBloodAssist || false,
//         skillshotsDodged: challenges.skillshotsDodged || 0,
//       },
//     };

//     const insights = this.generateInsights(
//       metrics,
//       position,
//       gameDurationMinutes,
//     );

//     const newAnalysis = new this.analysisModel({
//       userId,
//       matchId,
//       championName: participant.championName,
//       win: participant.win,
//       metrics,
//       insights,
//     });

//     return newAnalysis.save();
//   }

//   private generateInsights(
//     metrics: MatchMetrics,
//     position: string,
//     duration: number,
//   ): Insight[] {
//     const insights: Insight[] = [];
//     const adv = metrics.advanced;
//     const isCarry = ['MIDDLE', 'BOTTOM'].includes(position);
//     const isFrontline = ['TOP'].includes(position);

//     // PILAR 1: ECONOMIA E MACRO
//     if (position !== 'UTILITY' && position !== 'JUNGLE') {
//       if (adv.turretPlatesTaken >= 6) {
//         insights.push({
//           type: 'POSITIVE',
//           title: 'Rei do Macro (Barricadas)',
//           description: `Você destruiu incríveis ${adv.turretPlatesTaken} barricadas durante o jogo, gerando uma vantagem de ouro massiva para a equipe.`,
//         });
//       } else if (adv.csBefore10Minutes < 60) {
//         insights.push({
//           type: 'NEGATIVE',
//           title: 'Early Game Fraco (Farm)',
//           description: `Você farmou apenas ${adv.csBefore10Minutes} tropas nos primeiros 10 minutos. Perca menos ondas no início para acelerar seus itens.`,
//         });
//       } else if (metrics.csPerMin > 7.5) {
//         insights.push({
//           type: 'POSITIVE',
//           title: 'Economia de Alto Nível',
//           description: `Você manteve um farm excelente (${metrics.csPerMin} CS/min) e levou ${adv.turretPlatesTaken} barricadas globais. Pico de poder rápido.`,
//         });
//       } else {
//         insights.push({
//           type: 'COACHING',
//           title: 'Economia Estável',
//           description: `Seu farm foi de ${metrics.csPerMin} CS/min e você coletou ${adv.turretPlatesTaken} barricadas. Está na média.`,
//         });
//       }
//     } else {
//       insights.push({
//         type: 'COACHING',
//         title: 'Economia Baseada em Mapa',
//         description: `Sua prioridade não é farm. Foque em manter presença no mapa e distribuir vantagens para seus carregadores.`,
//       });
//     }

//     // PILAR 2: COMBATE E PRESENÇA
//     if (metrics.killParticipation < 40 && position !== 'TOP') {
//       insights.push({
//         type: 'NEGATIVE',
//         title: 'Jogador Isolado',
//         description: `Sua participação em abates foi de apenas ${metrics.killParticipation}%. Você focou no próprio jogo e deixou o time lutar em desvantagem.`,
//       });
//     } else if (adv.timeSpentDeadPercentage > 12) {
//       insights.push({
//         type: 'CRITICAL',
//         title: 'Excesso de Tempo Morto',
//         description: `Você passou ${adv.timeSpentDeadPercentage}% da partida inteira com a tela cinza. Valorize mais sua vida para não abrir o mapa.`,
//       });
//     } else {
//       insights.push({
//         type: 'POSITIVE',
//         title: 'Presença de Combate',
//         description: `Boa participação em lutas (${metrics.killParticipation}% KP). Você ajudou o time sem se expor desnecessariamente.`,
//       });
//     }

//     // PILAR 3: EFICIÊNCIA DE FUNÇÃO
//     if (position === 'JUNGLE') {
//       if (metrics.objectiveDamage > 20000) {
//         insights.push({
//           type: 'POSITIVE',
//           title: 'Controle de Objetivos',
//           description: `Causou ${metrics.objectiveDamage.toLocaleString()} de dano em objetivos. Dominou Dragões e Torres.`,
//         });
//       } else if (metrics.objectiveDamage < 8000) {
//         insights.push({
//           type: 'WARNING',
//           title: 'Abandono de Objetivos',
//           description: `Apenas ${metrics.objectiveDamage.toLocaleString()} de dano em objetivos. O Jungler precisa liderar as chamadas globais.`,
//         });
//       } else {
//         insights.push({
//           type: 'COACHING',
//           title: 'Objetivos na Média',
//           description: `Você ajudou nos objetivos, mas tente criar ainda mais pressão na selva inimiga.`,
//         });
//       }
//     } else if (isCarry) {
//       if (adv.damagePerGold < 0.8 && metrics.damagePerMinute < 500) {
//         insights.push({
//           type: 'WARNING',
//           title: 'Recursos Desperdiçados',
//           description: `Absorveu ouro, mas converteu apenas ${adv.damagePerGold} de dano/ouro. Faltou agressividade nas lutas.`,
//         });
//       } else if (adv.teamDamagePercentage > 30) {
//         insights.push({
//           type: 'POSITIVE',
//           title: 'Máquina de Dano',
//           description: `Você causou ${adv.teamDamagePercentage}% de todo o dano do seu time. Cumpriu seu papel.`,
//         });
//       } else {
//         insights.push({
//           type: 'COACHING',
//           title: 'Dano na Média',
//           description: `Você causou ${metrics.damagePerMinute} Dano Por Minuto. Procure oportunidades de "poke" seguras.`,
//         });
//       }
//     } else if (isFrontline) {
//       if (adv.damageMitigated > 35000) {
//         insights.push({
//           type: 'POSITIVE',
//           title: 'A Muralha',
//           description: `Mitigou ${adv.damageMitigated.toLocaleString()} de dano. Absorveu o impacto para o seu time bater.`,
//         });
//       } else {
//         insights.push({
//           type: 'COACHING',
//           title: 'Absorção de Dano',
//           description: `Busque se posicionar sempre à frente dos seus carregadores para protegê-los melhor.`,
//         });
//       }
//     } else if (position === 'UTILITY') {
//       if (adv.healAndShield > 10000 || adv.ccScore > 35) {
//         insights.push({
//           type: 'POSITIVE',
//           title: 'Suporte de Impacto',
//           description: `Excelente proteção/CC! Você foi crucial nas team fights.`,
//         });
//       } else {
//         insights.push({
//           type: 'COACHING',
//           title: 'Utilidade Padrão',
//           description: `Foque suas habilidades defensivas no jogador mais forte do time nas próximas partidas.`,
//         });
//       }
//     }

//     // PILAR 4: CONTROLE DE VISÃO
//     const visionPerMin = metrics.visionScore / duration;
//     if (position === 'UTILITY') {
//       if (visionPerMin < 1.5 || adv.controlWardsPlaced < 3) {
//         insights.push({
//           type: 'CRITICAL',
//           title: 'Visão Pobre (Suporte)',
//           description: `Wardou mal ou faltou Pinks. Domine a visão dos objetivos.`,
//         });
//       } else {
//         insights.push({
//           type: 'POSITIVE',
//           title: 'Controle de Mapa',
//           description: `Ótimo placar de visão (${visionPerMin.toFixed(1)}/min). Iluminou o mapa para a equipe.`,
//         });
//       }
//     } else {
//       if (visionPerMin < 0.5 || adv.controlWardsPlaced === 0) {
//         insights.push({
//           type: 'WARNING',
//           title: 'Ajude na Visão',
//           description: `Placar de visão baixo (${visionPerMin.toFixed(1)}/min) e faltaram Pinks. Visão é dever de todos.`,
//         });
//       } else {
//         insights.push({
//           type: 'COACHING',
//           title: 'Visão Adequada',
//           description: `Sua contribuição com visão foi satisfatória. Use trinkets em locais estratégicos.`,
//         });
//       }
//     }

//     // PILAR 5: MATCHUP (1V1 DA ROTA)
//     if (metrics.matchup.opponentChampion) {
//       const opName = metrics.matchup.opponentChampion;
//       if (metrics.matchup.goldDiff > 1000 && metrics.matchup.csDiff > 15) {
//         insights.push({
//           type: 'POSITIVE',
//           title: `Dominou a Rota`,
//           description: `Destruiu o(a) ${opName}, com ${metrics.matchup.goldDiff} de Ouro e ${metrics.matchup.csDiff} de farm a mais.`,
//         });
//       } else if (
//         metrics.matchup.goldDiff < -1000 &&
//         metrics.matchup.csDiff < -15
//       ) {
//         insights.push({
//           type: 'NEGATIVE',
//           title: `Sufoco na Rota`,
//           description: `Sofreu contra o(a) ${opName}. Jogue mais recuado em matchups difíceis.`,
//         });
//       } else {
//         insights.push({
//           type: 'COACHING',
//           title: `Rota Equilibrada`,
//           description: `O duelo contra o(a) ${opName} foi muito parelho em ouro e farm.`,
//         });
//       }
//     } else {
//       insights.push({
//         type: 'COACHING',
//         title: `Partida Atípica`,
//         description: `Sem oponente direto na rota. Foco nas estatísticas macro.`,
//       });
//     }

//     // ==========================================
//     // PILAR 6: O VEREDITO DA PARTIDA (CULPADO OU INOCENTE)
//     // ==========================================
//     const isWin = metrics.team.isWin;
//     const teamTotalDeaths = Math.max(1, metrics.team.totalDeaths); // Evita divisão por zero
//     const deathSharePercentage = (metrics.deaths / teamTotalDeaths) * 100;
//     const userKda =
//       (metrics.kills + metrics.assists) / Math.max(1, metrics.deaths);

//     if (isWin) {
//       if (metrics.killParticipation >= 60 || adv.teamDamagePercentage >= 35) {
//         insights.push({
//           type: 'POSITIVE',
//           title: 'Veredito: Hard Carry (Mochilão)',
//           description: `Você colocou o time nas costas. Participou de quase todas as jogadas e ditou o ritmo da vitória.`,
//         });
//       } else if (deathSharePercentage >= 25 && userKda < 1.5) {
//         insights.push({
//           type: 'WARNING',
//           title: 'Veredito: Carregado com Sucesso',
//           description: `Você sofreu bastante e foi responsável por ${deathSharePercentage.toFixed(1)}% das mortes do time. Mas no LoL, ser carregado também é uma arte. Agradeça sua equipe!`,
//         });
//       } else {
//         insights.push({
//           type: 'POSITIVE',
//           title: 'Veredito: Vitória Coletiva',
//           description: `Um esforço de equipe sólido. Você fez a sua parte de forma equilibrada para garantir a destruição do Nexus inimigo.`,
//         });
//       }
//     } else {
//       // CENÁRIOS DE DERROTA
//       if (
//         metrics.killParticipation >= 50 &&
//         deathSharePercentage <= 15 &&
//         adv.teamDamagePercentage >= 25
//       ) {
//         insights.push({
//           type: 'POSITIVE',
//           title: 'Veredito: 1v9 Injusto (Afundado)',
//           description: `Derrota frustrante. Você jogou muito bem, causou muito dano e morreu pouco (apenas ${deathSharePercentage.toFixed(1)}% das mortes do time). Infelizmente, sua equipe pesou e te afundou. Cabeça erguida!`,
//         });
//       } else if (deathSharePercentage >= 25 && userKda < 1.5) {
//         insights.push({
//           type: 'CRITICAL',
//           title: 'Veredito: Peso Morto (A Culpa foi sua)',
//           description: `Hora de assumir a responsabilidade. Você foi o alvo fácil do inimigo, concentrando ${deathSharePercentage.toFixed(1)}% das mortes totais do seu time. Você "feedou" o adversário e inviabilizou o jogo para os seus aliados.`,
//         });
//       } else {
//         insights.push({
//           type: 'NEGATIVE',
//           title: 'Veredito: Derrota Coletiva',
//           description: `O time todo foi superado. Você cometeu erros, mas não afundou sozinho. É necessário revisar as decisões em equipe no mid/late game.`,
//         });
//       }
//     }

//     return insights;
//   }
// }

// ###################### v8.0.0 - Análise Personalizada por Posição + Insights 5x Analíticos + Veredito Final (Culpado ou Inocente) + Recomendações de Treino (Em Breve) ######################
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Analysis, AnalysisDocument } from './schemas/analysis.schema';
import { MatchesService } from '../matches/matches.service';
import { UsersService } from '../users/users.service';
import { AiService } from '../ai/ai.service'; // <-- Import da IA aqui

type InsightType =
  | 'POSITIVE'
  | 'NEGATIVE'
  | 'WARNING'
  | 'CRITICAL'
  | 'COACHING';

interface Insight {
  type: InsightType;
  title: string;
  description: string;
}

interface MatchupStats {
  opponentChampion: string | null;
  goldDiff: number;
  csDiff: number;
  soloKills: number;
}

interface TeamMetrics {
  totalKills: number;
  totalDeaths: number;
  totalGold: number;
  totalDamage: number;
  isWin: boolean;
}

interface AdvancedMetrics {
  damagePerGold: number;
  teamDamagePercentage: number;
  controlWardsPlaced: number;
  csBefore10Minutes: number;
  turretPlatesTaken: number;
  timeSpentDeadPercentage: number;
  ccScore: number;
  damageMitigated: number;
  healAndShield: number;
  kitedKills: number;
  epicMonsterSteals: number;
  firstBloodInvolvement: boolean;
  skillshotsDodged: number;
}

interface MatchMetrics {
  kills: number;
  deaths: number;
  assists: number;
  csPerMin: number;
  visionScore: number;
  killParticipation: number;
  damagePerMinute: number;
  objectiveDamage: number;
  matchup: MatchupStats;
  advanced: AdvancedMetrics;
  team: TeamMetrics;
}

@Injectable()
export class AnalyzerService {
  constructor(
    @InjectModel(Analysis.name) private analysisModel: Model<AnalysisDocument>,
    private matchesService: MatchesService,
    private usersService: UsersService,
    private aiService: AiService, // <-- Injeção do AI Service
  ) {}

  async analyzeMatchForUser(userId: string, matchId: string) {
    const existingAnalysis = await this.analysisModel
      .findOne({ userId, matchId })
      .exec();
    if (existingAnalysis) {
      await this.analysisModel.deleteOne({ _id: existingAnalysis._id });
    }

    const user = await this.usersService.findById(userId);
    const match = await this.matchesService.findByMatchId(matchId);

    if (!user || !user.riotAccount)
      throw new NotFoundException('Conta Riot não vinculada.');
    if (!match)
      throw new NotFoundException(
        'Partida não encontrada no banco. Sincronize primeiro.',
      );

    if (match.gameDuration < 300) {
      throw new BadRequestException(
        'Partida muito curta (Remake). Não há dados suficientes para análise.',
      );
    }

    const puuid = user.riotAccount.puuid;
    const participant = match.info.participants.find(
      (p: any) => p.puuid === puuid,
    );
    if (!participant)
      throw new BadRequestException('O usuário não jogou esta partida.');

    const teamId = participant.teamId;
    const teamMates = match.info.participants.filter(
      (p: any) => p.teamId === teamId,
    );

    const teamTotalKills = teamMates.reduce(
      (acc: number, p: any) => acc + p.kills,
      0,
    );
    const teamTotalDeaths = teamMates.reduce(
      (acc: number, p: any) => acc + p.deaths,
      0,
    );
    const teamTotalGold = teamMates.reduce(
      (acc: number, p: any) => acc + p.goldEarned,
      0,
    );
    const teamTotalDamage = teamMates.reduce(
      (acc: number, p: any) => acc + p.totalDamageDealtToChampions,
      0,
    );

    const gameDurationMinutes = match.gameDuration / 60;
    const challenges = participant.challenges || {};

    const totalCs =
      participant.totalMinionsKilled + participant.neutralMinionsKilled;
    const csPerMin = totalCs / gameDurationMinutes;
    const killParticipation =
      teamTotalKills > 0
        ? ((participant.kills + participant.assists) / teamTotalKills) * 100
        : 0;
    const damagePerMinute =
      participant.totalDamageDealtToChampions / gameDurationMinutes;
    const damagePerGold =
      participant.goldEarned > 0
        ? participant.totalDamageDealtToChampions / participant.goldEarned
        : 0;
    const timeSpentDeadPercentage =
      (participant.totalTimeSpentDead / match.gameDuration) * 100;

    const position = participant.teamPosition;
    const opponent = match.info.participants.find(
      (p: any) => p.teamId !== teamId && p.teamPosition === position,
    );

    let matchupStats: MatchupStats = {
      opponentChampion: null,
      goldDiff: 0,
      csDiff: 0,
      soloKills: challenges.soloKills || 0,
    };
    if (opponent) {
      const opponentCs =
        opponent.totalMinionsKilled + opponent.neutralMinionsKilled;
      matchupStats = {
        opponentChampion: opponent.championName,
        goldDiff: participant.goldEarned - opponent.goldEarned,
        csDiff: totalCs - opponentCs,
        soloKills: challenges.soloKills || 0,
      };
    }

    const metrics: MatchMetrics = {
      kills: participant.kills,
      deaths: participant.deaths,
      assists: participant.assists,
      csPerMin: Number(csPerMin.toFixed(1)),
      visionScore: participant.visionScore,
      killParticipation: Number(killParticipation.toFixed(1)),
      damagePerMinute: Number(damagePerMinute.toFixed(0)),
      objectiveDamage: participant.damageDealtToObjectives,
      matchup: matchupStats,
      team: {
        totalKills: teamTotalKills,
        totalDeaths: teamTotalDeaths,
        totalGold: teamTotalGold,
        totalDamage: teamTotalDamage,
        isWin: participant.win,
      },
      advanced: {
        damagePerGold: Number(damagePerGold.toFixed(2)),
        teamDamagePercentage: Number(
          ((challenges.teamDamagePercentage || 0) * 100).toFixed(1),
        ),
        controlWardsPlaced:
          challenges.controlWardsPlaced ||
          participant.visionWardsBoughtInGame ||
          0,
        csBefore10Minutes: challenges.laneMinionsFirst10Minutes || 0,
        turretPlatesTaken: challenges.turretPlatesTaken || 0,
        timeSpentDeadPercentage: Number(timeSpentDeadPercentage.toFixed(1)),
        ccScore: participant.timeCCingOthers || 0,
        damageMitigated: participant.damageSelfMitigated || 0,
        healAndShield:
          (participant.totalHealsOnTeammates || 0) +
          (participant.totalDamageShieldedOnTeammates || 0),
        kitedKills: challenges.kitedKills || 0,
        epicMonsterSteals: challenges.epicMonsterSteals || 0,
        firstBloodInvolvement:
          participant.firstBloodKill || participant.firstBloodAssist || false,
        skillshotsDodged: challenges.skillshotsDodged || 0,
      },
    };

    // AQUI ESTÁ O AWAIT, já que agora a função vai na API do Google
    const insights = await this.generateInsights(
      metrics,
      position,
      gameDurationMinutes,
      participant.championName,
    );

    const newAnalysis = new this.analysisModel({
      userId,
      matchId,
      championName: participant.championName,
      win: participant.win,
      metrics,
      insights,
    });

    return newAnalysis.save();
  }

  // AGORA É ASYNC, e passamos o championName!
  private async generateInsights(
    metrics: MatchMetrics,
    position: string,
    duration: number,
    championName: string,
  ): Promise<Insight[]> {
    const insights: Insight[] = [];
    const adv = metrics.advanced;
    const isCarry = ['MIDDLE', 'BOTTOM'].includes(position);
    const isFrontline = ['TOP'].includes(position);

    // PILAR 1: ECONOMIA E MACRO
    if (position !== 'UTILITY' && position !== 'JUNGLE') {
      if (adv.turretPlatesTaken >= 6) {
        insights.push({
          type: 'POSITIVE',
          title: 'Rei do Macro (Barricadas)',
          description: `Você destruiu incríveis ${adv.turretPlatesTaken} barricadas durante o jogo, gerando uma vantagem de ouro massiva para a equipe.`,
        });
      } else if (adv.csBefore10Minutes < 60) {
        insights.push({
          type: 'NEGATIVE',
          title: 'Early Game Fraco (Farm)',
          description: `Você farmou apenas ${adv.csBefore10Minutes} tropas nos primeiros 10 minutos. Perca menos ondas no início para acelerar seus itens.`,
        });
      } else if (metrics.csPerMin > 7.5) {
        insights.push({
          type: 'POSITIVE',
          title: 'Economia de Alto Nível',
          description: `Você manteve um farm excelente (${metrics.csPerMin} CS/min) e levou ${adv.turretPlatesTaken} barricadas globais. Pico de poder rápido.`,
        });
      } else {
        insights.push({
          type: 'COACHING',
          title: 'Economia Estável',
          description: `Seu farm foi de ${metrics.csPerMin} CS/min e você coletou ${adv.turretPlatesTaken} barricadas. Está na média.`,
        });
      }
    } else {
      insights.push({
        type: 'COACHING',
        title: 'Economia Baseada em Mapa',
        description: `Sua prioridade não é farm. Foque em manter presença no mapa e distribuir vantagens para seus carregadores.`,
      });
    }

    // PILAR 2: COMBATE E PRESENÇA
    if (metrics.killParticipation < 40 && position !== 'TOP') {
      insights.push({
        type: 'NEGATIVE',
        title: 'Jogador Isolado',
        description: `Sua participação em abates foi de apenas ${metrics.killParticipation}%. Você focou no próprio jogo e deixou o time lutar em desvantagem.`,
      });
    } else if (adv.timeSpentDeadPercentage > 12) {
      insights.push({
        type: 'CRITICAL',
        title: 'Excesso de Tempo Morto',
        description: `Você passou ${adv.timeSpentDeadPercentage}% da partida inteira com a tela cinza. Valorize mais sua vida para não abrir o mapa.`,
      });
    } else {
      insights.push({
        type: 'POSITIVE',
        title: 'Presença de Combate',
        description: `Boa participação em lutas (${metrics.killParticipation}% KP). Você ajudou o time sem se expor desnecessariamente.`,
      });
    }

    // PILAR 3: EFICIÊNCIA DE FUNÇÃO
    if (position === 'JUNGLE') {
      if (metrics.objectiveDamage > 20000) {
        insights.push({
          type: 'POSITIVE',
          title: 'Controle de Objetivos',
          description: `Causou ${metrics.objectiveDamage.toLocaleString()} de dano em objetivos. Dominou Dragões e Torres.`,
        });
      } else if (metrics.objectiveDamage < 8000) {
        insights.push({
          type: 'WARNING',
          title: 'Abandono de Objetivos',
          description: `Apenas ${metrics.objectiveDamage.toLocaleString()} de dano em objetivos. O Jungler precisa liderar as chamadas globais.`,
        });
      } else {
        insights.push({
          type: 'COACHING',
          title: 'Objetivos na Média',
          description: `Você ajudou nos objetivos, mas tente criar ainda mais pressão na selva inimiga.`,
        });
      }
    } else if (isCarry) {
      if (adv.damagePerGold < 0.8 && metrics.damagePerMinute < 500) {
        insights.push({
          type: 'WARNING',
          title: 'Recursos Desperdiçados',
          description: `Absorveu ouro, mas converteu apenas ${adv.damagePerGold} de dano/ouro. Faltou agressividade nas lutas.`,
        });
      } else if (adv.teamDamagePercentage > 30) {
        insights.push({
          type: 'POSITIVE',
          title: 'Máquina de Dano',
          description: `Você causou ${adv.teamDamagePercentage}% de todo o dano do seu time. Cumpriu seu papel.`,
        });
      } else {
        insights.push({
          type: 'COACHING',
          title: 'Dano na Média',
          description: `Você causou ${metrics.damagePerMinute} Dano Por Minuto. Procure oportunidades de "poke" seguras.`,
        });
      }
    } else if (isFrontline) {
      if (adv.damageMitigated > 35000) {
        insights.push({
          type: 'POSITIVE',
          title: 'A Muralha',
          description: `Mitigou ${adv.damageMitigated.toLocaleString()} de dano. Absorveu o impacto para o seu time bater.`,
        });
      } else {
        insights.push({
          type: 'COACHING',
          title: 'Absorção de Dano',
          description: `Busque se posicionar sempre à frente dos seus carregadores para protegê-los melhor.`,
        });
      }
    } else if (position === 'UTILITY') {
      if (adv.healAndShield > 10000 || adv.ccScore > 35) {
        insights.push({
          type: 'POSITIVE',
          title: 'Suporte de Impacto',
          description: `Excelente proteção/CC! Você foi crucial nas team fights.`,
        });
      } else {
        insights.push({
          type: 'COACHING',
          title: 'Utilidade Padrão',
          description: `Foque suas habilidades defensivas no jogador mais forte do time nas próximas partidas.`,
        });
      }
    }

    // PILAR 4: CONTROLE DE VISÃO
    const visionPerMin = metrics.visionScore / duration;
    if (position === 'UTILITY') {
      if (visionPerMin < 1.5 || adv.controlWardsPlaced < 3) {
        insights.push({
          type: 'CRITICAL',
          title: 'Visão Pobre (Suporte)',
          description: `Wardou mal ou faltou Pinks. Domine a visão dos objetivos.`,
        });
      } else {
        insights.push({
          type: 'POSITIVE',
          title: 'Controle de Mapa',
          description: `Ótimo placar de visão (${visionPerMin.toFixed(1)}/min). Iluminou o mapa para a equipe.`,
        });
      }
    } else {
      if (visionPerMin < 0.5 || adv.controlWardsPlaced === 0) {
        insights.push({
          type: 'WARNING',
          title: 'Ajude na Visão',
          description: `Placar de visão baixo (${visionPerMin.toFixed(1)}/min) e faltaram Pinks. Visão é dever de todos.`,
        });
      } else {
        insights.push({
          type: 'COACHING',
          title: 'Visão Adequada',
          description: `Sua contribuição com visão foi satisfatória. Use trinkets em locais estratégicos.`,
        });
      }
    }

    // PILAR 5: MATCHUP (Coach IA Analisando Dados Reais)
    if (metrics.matchup.opponentChampion) {
      const opName = metrics.matchup.opponentChampion;

      // 1. Montamos o pacote de dados para enviar pra IA
      const aiData = {
        myChamp: championName,
        enemyChamp: opName,
        role: position,
        win: metrics.team.isWin,
        kills: metrics.kills,
        deaths: metrics.deaths,
        assists: metrics.assists,
        csPerMin: metrics.csPerMin,
        goldDiff: metrics.matchup.goldDiff,
        killParticipation: metrics.killParticipation,
      };

      // 2. A IA processa os números e devolve o texto pronto
      const aiAnalysis = await this.aiService.getMatchAnalysis(aiData);

      // 3. Definimos a cor do Card (Positivo/Negativo) baseado no ouro para a interface gráfica
      let insightType: InsightType = 'COACHING';
      if (metrics.matchup.goldDiff > 500) insightType = 'POSITIVE';
      else if (metrics.matchup.goldDiff < -500) insightType = 'NEGATIVE';

      insights.push({
        type: insightType,
        title: `Análise de IA: ${championName} vs ${opName}`,
        description: aiAnalysis,
      });
    } else {
      insights.push({
        type: 'COACHING',
        title: `Partida Atípica`,
        description: `Sem oponente direto na rota para análise de IA.`,
      });
    }

    // PILAR 6: O VEREDITO DA PARTIDA
    const isWin = metrics.team.isWin;
    const teamTotalDeaths = Math.max(1, metrics.team.totalDeaths);
    const deathSharePercentage = (metrics.deaths / teamTotalDeaths) * 100;
    const userKda =
      (metrics.kills + metrics.assists) / Math.max(1, metrics.deaths);

    if (isWin) {
      if (metrics.killParticipation >= 60 || adv.teamDamagePercentage >= 35) {
        insights.push({
          type: 'POSITIVE',
          title: 'Veredito: Hard Carry (Mochilão)',
          description: `Você colocou o time nas costas. Participou de quase todas as jogadas e ditou o ritmo da vitória.`,
        });
      } else if (deathSharePercentage >= 25 && userKda < 1.5) {
        insights.push({
          type: 'WARNING',
          title: 'Veredito: Carregado com Sucesso',
          description: `Você sofreu bastante e foi responsável por ${deathSharePercentage.toFixed(1)}% das mortes do time. Mas no LoL, ser carregado também é uma arte. Agradeça sua equipe!`,
        });
      } else {
        insights.push({
          type: 'POSITIVE',
          title: 'Veredito: Vitória Coletiva',
          description: `Um esforço de equipe sólido. Você fez a sua parte de forma equilibrada para garantir a destruição do Nexus inimigo.`,
        });
      }
    } else {
      if (
        metrics.killParticipation >= 50 &&
        deathSharePercentage <= 15 &&
        adv.teamDamagePercentage >= 25
      ) {
        insights.push({
          type: 'POSITIVE',
          title: 'Veredito: 1v9 Injusto (Afundado)',
          description: `Derrota frustrante. Você jogou muito bem, causou muito dano e morreu pouco (apenas ${deathSharePercentage.toFixed(1)}% das mortes do time). Infelizmente, sua equipe pesou e te afundou. Cabeça erguida!`,
        });
      } else if (deathSharePercentage >= 25 && userKda < 1.5) {
        insights.push({
          type: 'CRITICAL',
          title: 'Veredito: Peso Morto (A Culpa foi sua)',
          description: `Hora de assumir a responsabilidade. Você foi o alvo fácil do inimigo, concentrando ${deathSharePercentage.toFixed(1)}% das mortes totais do seu time. Você "feedou" o adversário e inviabilizou o jogo para os seus aliados.`,
        });
      } else {
        insights.push({
          type: 'NEGATIVE',
          title: 'Veredito: Derrota Coletiva',
          description: `O time todo foi superado. Você cometeu erros, mas não afundou sozinho. É necessário revisar as decisões em equipe no mid/late game.`,
        });
      }
    }

    return insights;
  }
}
