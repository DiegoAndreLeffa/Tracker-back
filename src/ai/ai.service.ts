import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

// Interface com os dados que vamos enviar para a IA
export interface AiMatchData {
  myChamp: string;
  enemyChamp: string;
  role: string;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  csPerMin: number;
  goldDiff: number;
  killParticipation: number;
}

@Injectable()
export class AiService {
  private ai: GoogleGenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.ai = new GoogleGenAI({ apiKey });
  }

  async getMatchAnalysis(data: AiMatchData): Promise<string> {
    // Aqui está a mágica: Injetamos os dados reais do jogador no cérebro da IA!
    const prompt = `
      Você é um coach profissional e analista de eSports de League of Legends.
      Faça uma análise direta, curta (máximo de 3 frases) e em tom de feedback para o jogador.
      
      Aqui estão os dados reais da última partida dele:
      - Campeão jogado: ${data.myChamp} na posição ${data.role}
      - Oponente direto na rota: ${data.enemyChamp}
      - Resultado da partida: ${data.win ? 'Vitória' : 'Derrota'}
      - KDA (Abates/Mortes/Assistências): ${data.kills}/${data.deaths}/${data.assists}
      - Farm por Minuto: ${data.csPerMin}
      - Vantagem de Ouro contra o oponente: ${data.goldDiff > 0 ? '+' : ''}${data.goldDiff} de ouro
      - Participação em Abates da equipe: ${data.killParticipation}%
      
      Escreva o feedback avaliando o desempenho dele no duelo contra o ${data.enemyChamp} e seu impacto no jogo com base nesses números. Fale diretamente com o jogador (Ex: "Você foi muito bem...").
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      if (response.text) {
        return response.text.trim();
      }

      return 'Análise não disponível no momento, mas foque em melhorar seu posicionamento.';
    } catch (error) {
      console.error('Erro ao gerar dica com IA:', error);
      return 'Análise de IA indisponível. Foco nos dados macro da partida.';
    }
  }
}
