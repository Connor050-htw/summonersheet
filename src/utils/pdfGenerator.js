import { jsPDF } from 'jspdf';
import championDataRaw from '../assets/data/championFull.json';

// Hilfsfunktion: ChampionId (int) zu Name
function getChampionNameById(id) {
  const champKey = String(id);
  const champions = championDataRaw.data;
  for (const champName in champions) {
    if (champions[champName].key === champKey) {
      return champions[champName].name;
    }
  }
  return `[ID: ${id}]`;
}

// Hilfsfunktion: Bild als DataURL laden
async function getProfileIconDataUrl(profileIconId) {
  const url = `${import.meta.env.BASE_URL}assets/data/profileicon/${profileIconId}.png`;
  const response = await fetch(url);
  const blob = await response.blob();
  return await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

// Mapping von Riot-Tier zu Dateinamen (deutsche Namen)
const rankIconMap = {
  IRON: 'Iron.png',
  BRONZE: 'Bronze.png',
  SILVER: 'Silver.png',
  GOLD: 'Gold.png',
  PLATINUM: 'Platinum.png',
  EMERALD: 'Emerald.png',
  DIAMOND: 'Diamond.png',
  MASTER: 'Master.png',
  GRANDMASTER: 'GrandMaster.png',
  CHALLENGER: 'Challenger.png',
};

async function getRankIconDataUrl(tier) {
  if (!tier) return null;
  const filename = rankIconMap[tier.toUpperCase()];
  if (!filename) return null;
  const url = `${import.meta.env.BASE_URL}assets/data/rankicon/${filename}`;
  const response = await fetch(url);
  const blob = await response.blob();
  return await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

// Async PDF-Generator!
export const generatePlayerPDF = async (playerData, championMastery, leagueDetails, riotId, summonerInfo, normalStats) => {
  const doc = new jsPDF();

  // Add a title
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('League of Legends Player Report', 10, 20);

  // Add timestamp oben rechts
  const now = new Date();
  const timestamp = now.toLocaleString();
  doc.setFontSize(10);
  doc.setFont('Helvetica', 'normal');
  doc.text(timestamp, 200, 15, { align: 'right' });

  // Add a horizontal line
  doc.setLineWidth(0.5);
  doc.line(10, 25, 200, 25);

  // Add Riot ID details
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(12);
  if (riotId && riotId.gameName && riotId.tagLine) {
    doc.text(`Riot ID: ${riotId.gameName}#${riotId.tagLine}`, 10, 40);
  } else {
    doc.text('Riot ID: [Unknown]', 10, 40);
  }

  // Add Summoner Level and Profile Icon
  let y = 50;
  if (summonerInfo) {
    doc.text(`Summoner Level: ${summonerInfo.summonerLevel ?? '[Unknown]'}`, 10, y);
    y += 10;
    if (summonerInfo.profileIconId) {
      try {
        const dataUrl = await getProfileIconDataUrl(summonerInfo.profileIconId);
        doc.text('Profile Icon:', 10, y);
        doc.addImage(dataUrl, 'PNG', 50, y - 5, 20, 20);
      } catch (e) {
        doc.text('Profile Icon: [Bild nicht gefunden]', 10, y);
      }
    } else {
      doc.text('Profile Icon: [Unknown]', 10, y);
    }
    y += 20;
  } else {
    doc.text('Summoner Level: [Unknown]', 10, y);
    y += 10;
    doc.text('Profile Icon: [Unknown]', 10, y);
    y += 20;
  }

  // Add player details
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(12);
  if (playerData && playerData.puuid) {
    doc.text(`Summoner Name: ${playerData.gameName || '[Unknown]'}`, 10, y);
    y += 10;
    doc.text(`Region: ${playerData.tagLine || '[Unknown]'}`, 10, y);
    y += 10;
  } else {
    doc.text('Summoner Name: [Placeholder]', 10, y);
    y += 10;
    doc.text('Region: [Placeholder]', 10, y);
    y += 10;
  }

  // Add league details (Rank, Wins, Losses)
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Ranked Stats:', 10, y);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(12);
  let rankY = y + 10;

  // Debug: Normal Stats ausgeben
  console.log('Normal Stats:', normalStats);

  if (leagueDetails && leagueDetails.length > 0) {
    for (const entry of leagueDetails) {
      const wins = entry.wins ?? 0;
      const losses = entry.losses ?? 0;
      const total = wins + losses;
      const winrate = total > 0 ? ((wins / total) * 100).toFixed(1) + '%' : '-';
      doc.text(
        `Queue: ${entry.queueType || '-'} | Rank: ${entry.tier || '-'} ${entry.rank || ''} | Wins: ${wins} | Losses: ${losses} | Winrate: ${winrate}`,
        10,
        rankY
      );
      // Rank-Icon anzeigen (rechts neben dem Text)
      if (entry.tier) {
        try {
          const dataUrl = await getRankIconDataUrl(entry.tier);
          doc.addImage(dataUrl, 'PNG', 120, rankY - 5, 15, 15);
        } catch (e) {
          // Icon nicht gefunden, ignoriere
        }
      }
      rankY += 20;
    }
  }
  // NEU: Normals anzeigen
  if ((!leagueDetails || leagueDetails.length === 0) && (!normalStats || normalStats.games === 0)) {
    doc.text('Keine Ranked- oder Normal-Daten gefunden.', 10, rankY);
    rankY += 10;
  }

  // Add top 3 champions
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Top 3 Most-Played Champions:', 10, rankY + 20);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(12);

  if (championMastery && championMastery.length > 0) {
    const imgSize = 65;
    const margin = 10;
    const pageWidth = 210; // A4 width in mm for jsPDF
    const totalImgs = Math.min(3, championMastery.length);
    const totalSpace = pageWidth - 2 * margin;
    const spaceBetween = 5;
    const totalImgWidth = imgSize * totalImgs + spaceBetween * (totalImgs - 1);
    const startX = margin + Math.floor((totalSpace - totalImgWidth) / 2);

    for (let i = 0; i < totalImgs; i++) {
      const champion = championMastery[i];
      const champName = getChampionNameById(champion.championId);
      const loadingImgUrl = `${import.meta.env.BASE_URL}assets/data/championloading/${champName}_0.jpg`;
      try {
        const response = await fetch(loadingImgUrl);
        const blob = await response.blob();
        const dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
        const x = startX + i * (imgSize + spaceBetween);
        const yImg = rankY + 30;
        doc.addImage(dataUrl, 'JPEG', x, yImg, imgSize, imgSize);

        // Trennbalken (außer nach dem letzten Bild)
        if (i < totalImgs - 1) {
          doc.setDrawColor(180);
          doc.setLineWidth(1);
          doc.line(x + imgSize + spaceBetween / 2, yImg, x + imgSize + spaceBetween / 2, yImg + imgSize);
        }

        // Champion-Infos unter das Bild schreiben
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(11);
        doc.text(`${i + 1}. ${champName}`, x, yImg + imgSize + 8);
        doc.setFontSize(10);
        doc.text(`Points: ${champion.championPoints}`, x, yImg + imgSize + 14);
        doc.text(`Level: ${champion.championLevel}`, x, yImg + imgSize + 20);
      } catch (e) {
        // Bild nicht gefunden, ignoriere
      }
    }
  } else {
    doc.text('No champion mastery data available.', 10, rankY + 30);
  }

  // Add footer
  doc.setFontSize(10);
  doc.text('Generated by SummonerSheet.gg', 10, 280);

  const pdfBlob = doc.output('blob');
  return URL.createObjectURL(pdfBlob); // Return the Blob URL
};

// Gibt die Stats der letzten 5 Normal Games zurück
export const getNormalStatsByPUUID = async (puuid) => {
  // 400 = Normal Blind Pick, 430 = Normal Draft Pick
  const normalQueueIds = [400, 430];
  let wins = 0;
  let losses = 0;

  // 1. Match-IDs holen (nur 5)
  const matchIdsResp = await riotApi.get(`/lol/match/v5/matches/by-puuid/${puuid}/ids`, {
    params: { start: 0, count: 5 },
  });
  const matchIds = matchIdsResp.data;

  // 2. Matches holen und auswerten
  for (const matchId of matchIds) {
    const matchResp = await riotApi.get(`/lol/match/v5/matches/${matchId}`);
    const match = matchResp.data;
    if (!normalQueueIds.includes(match.info.queueId)) continue;

    const participant = match.info.participants.find(p => p.puuid === puuid);
    if (!participant) continue;
    if (participant.win) wins++;
    else losses++;
  }

  return {
    queueType: 'NORMAL',
    wins,
    losses,
    games: wins + losses,
  };
};