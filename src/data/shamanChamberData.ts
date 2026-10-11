export interface ChamberQuestion {
  id: number;
  category: { kr: string; jp: string };
  icon: string;
  kr: string;
  jp: string;
}

export const CHAMBER_QUESTIONS: ChamberQuestion[] = [
  { id: 1, category: { kr: "돈/누수", jp: "金運/漏水" }, icon: "💰", kr: "오늘 내 주머니 노리는 놈이나 나도 모르게 줄줄 샐 돈 구멍이 어디냐?", jp: "今日、俺の財布を狙う奴や、無意識に金が漏れ出す穴はどこだ？" },
  { id: 2, category: { kr: "투자/승부", jp: "投資/勝負" }, icon: "🎲", kr: "지금 쥐고 있는 패(투자·신규 사업), 지금 돈 박아도 되냐 아니면 물릴 판이냐?", jp: "今の手札（投資・新規事業）、今突っ込むべきか、それとも罠に嵌まるか？" },
  { id: 3, category: { kr: "사람/뒤통수", jp: "人間関係/裏切り" }, icon: "🗡️", kr: "내 주변에 앞에서 웃고 등 뒤에서 칼 갈고 있는 음흉한 인간이 누구냐?", jp: "目の前で笑いながら、背中越しに刃を研いでいる陰険な奴は誰だ？" },
  { id: 4, category: { kr: "애정/딴마음", jp: "恋愛/浮気心" }, icon: "💔", kr: "그 인간 속마음이 진짜 나한테 있는 거냐, 딴주머니 차고 딴생각 품었냐?", jp: "あいつの本心は本当に俺にあるのか？ 隠し事や浮気心を抱いてないか？" },
  { id: 5, category: { kr: "비즈니스", jp: "ビジネス" }, icon: "🏢", kr: "내일 미팅/계약, 내가 먼저 밥상을 엎고 세게 나가야 하나 맞춰줘야 하나?", jp: "明日の商談・契約、こちらから仕掛けて強気に出るべきか、下手に出るべきか？" },
  { id: 6, category: { kr: "독립/손절", jp: "独立/損切り" }, icon: "🚪", kr: "지금 발 묶여 있는 이 조직/동업/거래처, 지금 당장 손 털고 찢어져야 할 때냐?", jp: "今縛られているこの組織・共同事業・取引先、今すぐ縁を切るべき時か？" },
  { id: 7, category: { kr: "기운/액운", jp: "気力/厄払い" }, icon: "🌿", kr: "만사가 귀찮고 기운이 바닥을 치는데, 잡스러운 액운이냐 어디서 막힌 거냐?", jp: "気力が底をつき体が重い。厄が憑いているのか、どこで気の流れが詰まった？" },
  { id: 8, category: { kr: "관재/소송", jp: "官災/訴訟" }, icon: "⚖️", kr: "얽히고설킨 싸움·돈 문제, 도대체 언제 끝나고 마지막에 누가 피를 보냐?", jp: "泥沼の争い・金銭トラブル、いつ決着がつき最後に誰が痛手を見る？" },
  { id: 9, category: { kr: "양자택일", jp: "二者択一" }, icon: "🔀", kr: "머리 터지게 저울질 중인 두 갈래 길, 어느 쪽을 잡아야 후회 안 하고 살아남냐?", jp: "頭が割れそうな二者択一、どちらを掴めば後悔せず生き残れる？" },
  { id: 10, category: { kr: "대운/변곡점", jp: "大運/変曲点" }, icon: "🌋", kr: "이 지긋지긋한 밑바닥은 언제 끝나고, 내 세상 만나는 황금빛 변곡점은 언제냐?", jp: "このうんざりする底辺はいつ抜け出せる？ 運命がひっくり返る変曲点はいつだ？" }
];

export interface TalismanCardItem {
  id: string;
  name: { kr: string; jp: string };
  archetype: { kr: string; jp: string };
  color: string;
  element: string;
  meaning: { kr: string; jp: string };
  // 호환용 별칭
  desc?: { kr: string; jp: string };
  hanja?: string;
}

export const TALISMAN_CARDS: TalismanCardItem[] = [
  {
    id: 'wood',
    name: { kr: "청룡벽력부 (木)", jp: "青龍霹靂符 (木)" },
    archetype: { kr: "돌파와 기획", jp: "突破と企画" },
    color: "#00ffcc",
    element: "木",
    meaning: { kr: "정체된 판을 깨고 새 판을 짜는 벼락의 기운", jp: "停滞を打破し新たな活路を開く雷の気" },
    desc: { kr: "정체된 판을 깨고 새 판을 짜는 벼락의 기운", jp: "停滞を打破し新たな活路を開く雷の気" },
    hanja: "靑龍"
  },
  {
    id: 'fire',
    name: { kr: "주작점화부 (火)", jp: "朱雀点火符 (火)" },
    archetype: { kr: "열정과 주도권", jp: "情熱と主導権" },
    color: "#ff0055",
    element: "火",
    meaning: { kr: "어둠 속에 불을 당겨 세상의 이목을 끄는 불꽃", jp: "暗闇に火を灯し世の耳目を惹きつける情熱" },
    desc: { kr: "어둠 속에 불을 당겨 세상의 이목을 끄는 불꽃", jp: "暗闇に火を灯し世の耳目を惹きつける情熱" },
    hanja: "朱雀"
  },
  {
    id: 'earth',
    name: { kr: "황룡반석부 (土)", jp: "黄龍盤石符 (土)" },
    archetype: { kr: "터전과 신용", jp: "拠点と信用" },
    color: "#ffb700",
    element: "土",
    meaning: { kr: "흔들리지 않는 대지처럼 계약과 자산을 묶는 힘", jp: "揺るぎなき大地のように契約と資産を固める力" },
    desc: { kr: "흔들리지 않는 대지처럼 계약과 자산을 묶는 힘", jp: "揺るぎなき大地のように契約と資産を固める力" },
    hanja: "黃龍"
  },
  {
    id: 'metal',
    name: { kr: "백호단두부 (金)", jp: "白虎断頭符 (金)" },
    archetype: { kr: "결단과 악연절단", jp: "決断と悪縁断絶" },
    color: "#ffffff",
    element: "金",
    meaning: { kr: "썩은 인연을 가차 없이 베어내고 결실을 거두는 칼날", jp: "腐れ縁を断ち切り冷徹に実りを手にする刃" },
    desc: { kr: "썩은 인연을 가차 없이 베어내고 결실을 거두는 칼날", jp: "腐れ縁を断ち切り冷徹に実りを手にする刃" },
    hanja: "白虎"
  },
  {
    id: 'water',
    name: { kr: "현무유심부 (水)", jp: "玄武流心符 (水)" },
    archetype: { kr: "지혜와 자금맥", jp: "知恵と資金流" },
    color: "#0088ff",
    element: "水",
    meaning: { kr: "함정을 우회하고 깊은 물길처럼 돈맥을 트는 지략", jp: "罠を回避し深海のように資金の流れを開通させる知恵" },
    desc: { kr: "함정을 우회하고 깊은 물길처럼 돈맥을 트는 지략", jp: "罠を回避し深海のように資金の流れを開通させる知恵" },
    hanja: "玄武"
  }
];
