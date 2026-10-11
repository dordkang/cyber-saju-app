export const SAJU_LEXICON = {
  gods: {
    '비견': { ko: '비견', ja: '比肩' },
    '겁재': { ko: '겁재', ja: '劫財' },
    '식신': { ko: '식신', ja: '食神' },
    '상관': { ko: '상관', ja: '傷官' },
    '편재': { ko: '편재', ja: '偏財' },
    '정재': { ko: '정재', ja: '正財' },
    '편관': { ko: '편관', ja: '偏官' },
    '정관': { ko: '정관', ja: '正官' },
    '편인': { ko: '편인', ja: '偏印' },
    '정인': { ko: '정인', ja: '印綬' },
  },
  shinsal: {
    '천을귀인': { ko: '천을귀인', ja: '天乙貴人' },
    '도화': { ko: '도화살', ja: '桃花' },
    '역마': { ko: '역마살', ja: '駅馬' },
    '화개': { ko: '화개살', ja: '華蓋' },
    '양인': { ko: '양인살', ja: '羊刃' },
    '귀문관': { ko: '귀문관살', ja: '鬼門関' },
  },
  ohaengAura: {
    '목': { ko: '청목(靑木)의 기운', ja: '青木(樹木)の気' },
    '화': { ko: '적화(赤火)의 기운', ja: '紅火(太陽・情熱)の気' },
    '토': { ko: '황토(黃土)의 기운', ja: '大地の気 (黄土)' },
    '금': { ko: '백금(白金)의 기운', ja: '白金(決断・鉱石)の気' },
    '수': { ko: '흑수(黑水)의 기운', ja: '玄水(知恵・深海)の気' },
  },
  relations: {
    '배우자': { ko: '배우자', ja: '配偶者' },
    '연인': { ko: '연인', ja: '恋人' },
    '동업자': { ko: '동업자/비즈니스', ja: 'ビジネスパートナー' },
    '썸': { ko: '썸/관심 상대', ja: '気になる相手' },
  },
};

export function formatSajuTerm(term: string, lang: 'kr' | 'jp' | 'ko' | 'ja' = 'jp'): string {
  if (!term) return '';
  // 한국어 잔존 표현 강제 치환
  if (lang === 'jp' || lang === 'ja') {
    let res = term
      .replace(/겁재/g, '劫財')
      .replace(/비견/g, '比肩')
      .replace(/식신/g, '食神')
      .replace(/상관/g, '傷官')
      .replace(/편재/g, '偏財')
      .replace(/정재/g, '正財')
      .replace(/편관/g, '偏官')
      .replace(/정관/g, '正官')
      .replace(/편인/g, '偏印')
      .replace(/정인/g, '印綬')
      .replace(/천을귀인\(天乙貴人\)/g, '天乙貴人')
      .replace(/천을귀인/g, '天乙貴人')
      .replace(/양인살\(羊刃殺\)/g, '羊刃')
      .replace(/양인살/g, '羊刃')
      .replace(/백호살\(白虎殺\)/g, '白虎')
      .replace(/백호살/g, '白虎')
      .replace(/도화살\(桃花殺\)/g, '桃花')
      .replace(/도화살/g, '桃花')
      .replace(/도화/g, '桃花')
      .replace(/역마살\(驛馬殺\)/g, '駅馬')
      .replace(/역마살/g, '駅馬')
      .replace(/화개살\(華蓋殺\)/g, '華蓋')
      .replace(/화개살/g, '華蓋')
      .replace(/귀문관살/g, '鬼門関')
      .replace(/황토\(黃土\)의 기운/g, '大地の気 (黄土)')
      .replace(/청목\(靑木\)의 기운/g, '青木(樹木)の気')
      .replace(/적화\(赤火\)의 기운/g, '紅火(太陽・情熱)の気')
      .replace(/백금\(白金\)의 기운/g, '白金(決断・鉱石)の気')
      .replace(/흑수\(黑水\)의 기운/g, '玄水(知恵・深海)の気')
      .replace(/배우자/g, '配偶者')
      .replace(/연인/g, '恋人')
      .replace(/동업자/g, 'ビジネスパートナー')
      .replace(/상대방/g, 'お相手')
      .replace(/일간/g, '日干')
      .replace(/호스트/g, 'ホスト');
    return res;
  }
  return term;
}
