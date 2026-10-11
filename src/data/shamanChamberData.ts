export interface ChamberQuestion {
  id: number;
  category: string;
  icon: string;
  kr: string;
  jp: string;
}

export const CHAMBER_QUESTIONS: ChamberQuestion[] = [
  { id: 1, category: "돈/누수", icon: "💰", kr: "오늘 내 주머니 노리는 놈이나 나도 모르게 줄줄 샐 돈 구멍이 어디냐?", jp: "今日、俺の財布を狙う奴や、無意識に金が漏れ出す穴はどこだ？" },
  { id: 2, category: "투자/승부", icon: "🎲", kr: "지금 쥐고 있는 패(투자·신규 사업), 지금 돈 박아도 되냐 아니면 물릴 판이냐?", jp: "今の手札（投資・新規事業）、今突っ込むべきか、それとも罠に嵌まるか？" },
  { id: 3, category: "사람/뒤통수", icon: "🗡️", kr: "내 주변에 앞에서 웃고 등 뒤에서 칼 갈고 있는 음흉한 인간이 누구냐?", jp: "目の前で笑いながら、背中越しに刃を研いでいる陰険な奴は誰だ？" },
  { id: 4, category: "애정/딴마음", icon: "💔", kr: "그 인간 속마음이 진짜 나한테 있는 거냐, 딴주머니 차고 딴생각 품었냐?", jp: "あいつの本心は本当に俺にあるのか？ 隠し事や浮気心を抱いてないか？" },
  { id: 5, category: "비즈니스", icon: "🏢", kr: "내일 미팅/계약, 내가 먼저 밥상을 엎고 세게 나가야 하나 맞춰줘야 하나?", jp: "明日の商談・契約、こちらから仕掛けて強気に出るべきか、下手に出るべきか？" },
  { id: 6, category: "독립/손절", icon: "🚪", kr: "지금 발 묶여 있는 이 조직/동업/거래처, 지금 당장 손 털고 찢어져야 할 때냐?", jp: "今縛られているこの組織・共同事業・取引先、今すぐ縁を切るべき時か？" },
  { id: 7, category: "기운/액운", icon: "🌿", kr: "만사가 귀찮고 기운이 바닥을 치는데, 잡스러운 액운이냐 어디서 막힌 거냐?", jp: "気力が底をつき体が重い。厄が憑いているのか、どこで気の流れが詰まった？" },
  { id: 8, category: "관재/소송", icon: "⚖️", kr: "얽히고설킨 싸움·돈 문제, 도대체 언제 끝나고 마지막에 누가 피를 보냐?", jp: "泥沼の争い・金銭トラブル、いつ決着がつき最後に誰が痛手を見る？" },
  { id: 9, category: "양자택일", icon: "🔀", kr: "머리 터지게 저울질 중인 두 갈래 길, 어느 쪽을 잡아야 후회 안 하고 살아남냐?", jp: "頭が割れそうな二者択一、どちらを掴めば後悔せず生き残れる？" },
  { id: 10, category: "대운/변곡점", icon: "🌋", kr: "이 지긋지긋한 밑바닥은 언제 끝나고, 내 세상 만나는 황금빛 변곡점은 언제냐?", jp: "このうんざりする底辺はいつ抜け出せる？ 運命がひっくり返る変曲点はいつだ？" }
];

export interface TalismanCardItem {
  id: string;
  name: { kr: string; jp: string };
  desc: { kr: string; jp: string };
  element: 'wood' | 'fire' | 'earth' | 'metal' | 'water';
  color: string;
  hanja: string;
}

export const TALISMAN_CARDS: TalismanCardItem[] = [
  { id: 'wood', element: 'wood', color: '#00F5D4', hanja: '靑龍', name: { kr: '청룡벽력부 (木)', jp: '青龍霹靂符 (木)' }, desc: { kr: '멈춘 판을 깨부수고 기획과 실행의 싹을 틔운다', jp: '停滞を打ち破り、企画と実行の芽を吹き出させる' } },
  { id: 'fire', element: 'fire', color: '#FF2A4B', hanja: '朱雀', name: { kr: '주작점화부 (火)', jp: '朱雀点火符 (火)' }, desc: { kr: '어둠 속에 불을 당겨 세상의 이목과 판세를 주도한다', jp: '暗闇に火を灯し、世の耳目を集めて盤勢を主導する' } },
  { id: 'earth', element: 'earth', color: '#FFB703', hanja: '黃龍', name: { kr: '황룡반석부 (土)', jp: '黄龍盤石符 (土)' }, desc: { kr: '흔들리는 터전을 굳건히 묶고 천을귀인의 신용을 다진다', jp: '揺らぐ拠点を固め、天乙貴人の信用を盤石にする' } },
  { id: 'metal', element: 'metal', color: '#D9E4F2', hanja: '白虎', name: { kr: '백호단두부 (金)', jp: '白虎断頭符 (金)' }, desc: { kr: '썩은 인연을 가차 없이 베어내고 현금 결실을 거머쥔다', jp: '腐れ縁を断ち切り、冷徹に現金の結実を手にする' } },
  { id: 'water', element: 'water', color: '#4DA3FF', hanja: '玄武', name: { kr: '현무유심부 (水)', jp: '玄武流心符 (水)' }, desc: { kr: '깊은 지혜로 함정을 우회하고 무재고 자금맥을 튼다', jp: '深遠な知恵で罠を回避し、キャッシュフローを開通させる' } },
];
