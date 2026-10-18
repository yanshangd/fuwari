import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
	darkMode: "class",
	content: ["./src/**/*.{ts,tsx}"],
	theme: {
		extend: {
			colors: {
				primary: "var(--primary)",
				pageBg: "var(--page-bg)",
				cardBg: "var(--card-bg)",
				btnContent: "var(--btn-content)",
				btnRegularBg: "var(--btn-regular-bg)",
				btnRegularBgHover: "var(--btn-regular-bg-hover)",
				btnRegularBgActive: "var(--btn-regular-bg-active)",
				btnPlainBgHover: "var(--btn-plain-bg-hover)",
				btnPlainBgActive: "var(--btn-plain-bg-active)",
				btnCardBgHover: "var(--btn-card-bg-hover)",
				btnCardBgActive: "var(--btn-card-bg-active)",
				deepText: "var(--deep-text)",
				lineDivider: "var(--line-divider)",
				lineColor: "var(--line-color)",
				metaDivider: "var(--meta-divider)",
				inlineCodeBg: "var(--inline-code-bg)",
				inlineCodeColor: "var(--inline-code-color)",
				floatPanelBg: "var(--float-panel-bg)",
			},
			borderColor: {
				line: "var(--line-color)",
			},
			fontFamily: {
				sans: [
					"Roboto",
					'"Helvetica Neue"',
					"Arial",
					"Pyidaengti",
					'"Microsoft YaHei"',
					"微软雅黑",
					"PingFang SC",
					"HanSansSC",
					"noto cjk",
					"w3c-zen-hei-rw-gbv",
					"sans-serif",
				],
				mono: [
					'"JetBrains Mono Variable"',
					'"JetBrains Mono"',
					"ui-monospace",
					"SFMono-Regular",
					"Menlo",
					"monospace",
				],
			},
			borderRadius: {
				large: "var(--radius-large)",
			},
		},
	},
	plugins: [typography],
};

export default config;
