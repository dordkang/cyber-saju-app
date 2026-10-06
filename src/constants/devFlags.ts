/** 개발·테스트용 프리패스. true면 결제 없이 유료 리포트가 바로 열린다. 배포 전에 false로 바꾼다. */
export const IS_TEST_MODE = true;

export const REPORT_PRICE_LABEL = '₩3,900';

export const REPORT_BUTTON_LABEL = IS_TEST_MODE
  ? '정밀 분석 리포트 열기'
  : `정밀 분석 리포트 > ${REPORT_PRICE_LABEL}`;
