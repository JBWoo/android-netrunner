import { CARD_DATABASE } from './src/game/cards';

async function main() {
  try {
    console.log('📡 NetrunnerDB API v3에서 System Gateway 카드 데이터를 가져오는 중...');
    const res = await fetch('https://api-preview.netrunnerdb.com/api/v3/public/cards?filter[card_set_id]=system_gateway');
    const json = await res.json() as any;
    
    if (!json.data) {
      console.log('No data found:', json);
      return;
    }

    console.log(`✅ ${json.data.length}개의 System Gateway 카드를 받아왔습니다.`);
    console.log('==================================================================');
    console.log('🔍 로컬 CARD_DATABASE와 NetrunnerDB API 정밀 교차 검증');
    console.log('==================================================================\n');

    const apiCards: Map<string, any> = new Map();
    json.data.forEach((c: any) => {
      const cleanTitle = c.attributes.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      apiCards.set(cleanTitle, c.attributes);
    });

    let matchCount = 0;
    let discrepancyCount = 0;

    Object.keys(CARD_DATABASE).forEach((key) => {
      const localCard = CARD_DATABASE[key];
      const cleanLocalTitle = localCard.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      const apiCard = apiCards.get(cleanLocalTitle);
      if (!apiCard) {
        console.log(`❓ [미매칭] 로컬 카드 '${localCard.title}'를 API에서 찾을 수 없습니다.`);
        return;
      }

      matchCount++;
      const discrepancies: string[] = [];

      // 1. 일반 코스트 비교 (Agenda 외)
      if (localCard.type !== 'Agenda' && localCard.type !== 'Identity') {
        const apiCost = apiCard.cost !== null ? Number(apiCard.cost) : null;
        if (localCard.cost !== apiCost) {
          discrepancies.push(`비용(Cost): 로컬=${localCard.cost}🪙 vs API=${apiCost}🪙`);
        }
      }

      // 2. 아젠다 발전비용 및 승점 비교
      if (localCard.type === 'Agenda') {
        const apiAdvCost = apiCard.advancement_requirement !== null ? Number(apiCard.advancement_requirement) : null;
        const apiPoints = apiCard.agenda_points !== null ? Number(apiCard.agenda_points) : null;
        if (localCard.advancementCost !== apiAdvCost) {
          discrepancies.push(`발전 비용: 로컬=${localCard.advancementCost} vs API=${apiAdvCost}`);
        }
        if (localCard.agendaPoints !== apiPoints) {
          discrepancies.push(`아젠다 승점: 로컬=${localCard.agendaPoints}P vs API=${apiPoints}P`);
        }
      }

      // 3. 강도(Strength) 비교 (ICE 또는 아이스브레이커 등)
      if (localCard.strength !== undefined || apiCard.strength !== null) {
        const localStr = localCard.strength;
        const apiStr = apiCard.strength !== null ? Number(apiCard.strength) : undefined;
        if (localStr !== apiStr) {
          discrepancies.push(`강도(Strength): 로컬=${localStr} vs API=${apiStr}`);
        }
      }

      if (discrepancies.length > 0) {
        discrepancyCount++;
        console.log(`❌ [불일치 감지] 카드: ${localCard.title} (${localCard.type})`);
        discrepancies.forEach(line => console.log(`   👉 ${line}`));
        console.log(`   - API 영어 텍스트: "${apiCard.text}"`);
        console.log(`   - 로컬 한글 텍스트: "${localCard.text}"\n`);
      }
    });

    console.log('==================================================================');
    console.log(`📊 검증 요약:`);
    console.log(`   - 검증된 로컬 카드 수: ${matchCount} / 32`);
    console.log(`   - 수치 불일치 발견 건수: ${discrepancyCount} 건`);
    if (discrepancyCount === 0) {
      console.log('🎉 로컬 데이터베이스가 NetrunnerDB API 상의 수치(비용/강도)와 100% 일치합니다!');
    } else {
      console.log('⚠️ 일부 카드 데이터 수치 조율이 필요합니다. 위의 리포트를 검토해 주세요.');
    }
    console.log('==================================================================');

  } catch (err) {
    console.error('API Fetch 중 에러 발생:', err);
  }
}

main();
