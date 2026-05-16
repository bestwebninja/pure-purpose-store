export type VettingMatrixEntry = {
  point: string;
  userInput: string;
  proData: string;
  status: "PASS" | "FLAG" | "FAIL";
  action: string;
};

