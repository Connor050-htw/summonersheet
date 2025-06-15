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

  // Timestamp und Footer vorbereiten (nur EINMAL deklarieren)
  const now = new Date();
  const timestamp = now.toLocaleString();

  // Maße für Header
  const pageWidth = 210;
  const profileSize = 32;
  const profileX = 12;
  const profileY = 10;
  const border = 4;

  // Profilbild mit goldener Umrandung
  if (summonerInfo && summonerInfo.profileIconId) {
    try {
      // Goldener Rahmen
      doc.setDrawColor(226, 192, 141); // Gold
      doc.setLineWidth(border);
      doc.rect(profileX - border / 2, profileY - border / 2, profileSize + border, profileSize + border, 'S');
      // Profilbild
      const dataUrl = await getProfileIconDataUrl(summonerInfo.profileIconId);
      doc.addImage(dataUrl, 'PNG', profileX, profileY, profileSize, profileSize);
    } catch (e) {
      doc.text('Profile Icon: [Bild nicht gefunden]', profileX, profileY + profileSize + 8);
    }
  } else {
    doc.text('Profile Icon: [Unknown]', profileX, profileY + profileSize + 8);
  }

  // Name und Tag zentriert, groß
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(26);
  const nameTag = riotId && riotId.gameName && riotId.tagLine
    ? `${riotId.gameName}#${riotId.tagLine}`
    : '[Unknown]';
  doc.text(nameTag, pageWidth / 2, profileY + profileSize / 2 + 6, { align: 'center' });

  // Summoner Level und Region rechts oben
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(13);
  const infoX = pageWidth - 12;
  doc.text(`Summoner Level: ${summonerInfo?.summonerLevel ?? '[Unknown]'}`, infoX, profileY + 8, { align: 'right' });
  doc.text(`Region: ${playerData?.tagLine || '[Unknown]'}`, infoX, profileY + 18, { align: 'right' });

  // fette schwarze Linie darunter
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(1.5);
  doc.line(10, profileY + profileSize + 12, pageWidth - 10, profileY + profileSize + 12);

  // y-Position für den weiteren Inhalt
  let y = profileY + profileSize + 20;

  // Add league details (Rank, Wins, Losses)
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(18); // Schrift größer
  doc.text('Ranked Stats', pageWidth / 2, y, { align: 'center' }); // zentriert

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(12);
  let rankY = y + 10;

  // Debug: Normal Stats ausgeben
  console.log('Normal Stats:', normalStats);

  function getQueueDisplayName(queueType) {
    switch ((queueType || '').toUpperCase()) {
      case 'RANKED_SOLO_5X5':
      case 'SOLO_5X5':
      case 'SOLOQ':
        return 'Solo-Ranked';
      case 'RANKED_FLEX_SR':
      case 'FLEX_SR':
      case 'FLEX':
        return 'Flex-Ranked';
      case 'RANKED_TFT':
        return 'TFT-Ranked';
      case 'NORMAL_DRAFT':
        return 'Normal Draft';
      case 'NORMAL':
        return 'Normal';
      default:
        return queueType || '-';
    }
  }

  if (leagueDetails && leagueDetails.length > 0) {
    for (const entry of leagueDetails) {
      const wins = entry.wins ?? 0;
      const losses = entry.losses ?? 0;
      const total = wins + losses;
      const winrate = total > 0 ? ((wins / total) * 100).toFixed(1) + '%' : '-';

      // Farben für die Ranks
      const rankBgColors = {
        IRON: [80, 80, 80],
        BRONZE: [176, 141, 87],
        SILVER: [180, 180, 200],
        GOLD: [255, 215, 64],
        PLATINUM: [64, 224, 208],
        EMERALD: [80, 200, 120],
        DIAMOND: [90, 155, 255],
        MASTER: [186, 85, 211],
        GRANDMASTER: [220, 20, 60],
        CHALLENGER: [255, 215, 0]
      };
      const rank = (entry.tier || '').toUpperCase();
      const color = rankBgColors[rank] || [55, 55, 55];

      // Text
      doc.setFontSize(15); // Text größer machen
      doc.setFont('Helvetica', 'bold');
      const queueText = `${getQueueDisplayName(entry.queueType)} | ${entry.tier || '-'} ${entry.rank || ''} | Wins: ${wins} | Losses: ${losses} | Winrate: ${winrate}`;

      // Farbig umrahmter Rahmen NUR um den Rank-Text
      const rankStr = `${entry.tier || '-'}`;
      const rankStart = queueText.indexOf(rankStr);
      // Schätze die X-Position des Ranks im Text (Font ist monospace-ähnlich)
      const charWidth = 2.6; // ggf. anpassen je nach Schrift
      const rankBoxX = 7;
      const rankBoxY = rankY - 7;
      const rankBoxWidth = 195; // Breite für Tier + evtl. Division
      doc.setDrawColor(color[0], color[1], color[2]);
      doc.setLineWidth(1.2);
      doc.rect(rankBoxX, rankBoxY, rankBoxWidth, 12, 'S');

      // Rank-Text (zentriert im Rahmen)
      doc.setTextColor(0, 0, 0);
      doc.text(queueText, 10, rankY);

      // Rank-Icon anzeigen (rechts neben dem Text)
      if (entry.tier) {
        try {
          const dataUrl = await getRankIconDataUrl(entry.tier);
          doc.addImage(dataUrl, 'PNG', 180, rankY - 9, 15, 15);
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
  // fette schwarze Linie darunter (wie oben)
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(1.5);
  doc.line(10, rankY + 12, pageWidth - 10, rankY + 12);

  // Add top 3 champions (zentriert, gleiche Größe und Fett wie Ranked Stats)
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Top 3 Most-Played Champions', pageWidth / 2, rankY + 20, { align: 'center' });

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
          doc.setDrawColor(120);
          doc.setLineWidth(1);
          doc.line(x + imgSize + spaceBetween / 2, yImg, x + imgSize + spaceBetween / 2, yImg + imgSize);
        }

        // Champion-Infos unter das Bild schreiben
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(11);
        doc.text(`${champName}`, x, yImg + imgSize + 8);
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

  // Add footer (nutze die oben deklarierten Variablen)
  doc.setFontSize(10);
  doc.text(timestamp, 10, 290);
  doc.text('Generated by SummonerSheet.gg', 200, 290, { align: 'right' });

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