# [1.6.0](https://github.com/zamanapp/hadid/compare/v1.5.0...v1.6.0) (2025-06-10)


### Features

* enhance extraction response instructions to ensure valid JSON output ([2e288e0](https://github.com/zamanapp/hadid/commit/2e288e0bf64878e9db9c6674aab52adf7f21c5a7))

# [1.5.0](https://github.com/zamanapp/hadid/compare/v1.4.0...v1.5.0) (2025-06-10)


### Features

* update image handling to dynamically set media type based on file buffer ([f02fe3f](https://github.com/zamanapp/hadid/commit/f02fe3f6182b8a295d35d377987c92e07e48c4f7))

# [1.4.0](https://github.com/zamanapp/hadid/compare/v1.3.0...v1.4.0) (2025-06-04)


### Features

* add imageFilePaths to HadidArgs interface and update hadid function to handle image inputs ([1c1a13e](https://github.com/zamanapp/hadid/commit/1c1a13eba464fae61f598f38aaaa5f0388a1c5ad))

# [1.3.0](https://github.com/zamanapp/hadid/compare/v1.2.2...v1.3.0) (2025-06-01)


### Features

* update HadidArgs interface to make filePath optional and add textContent property ([15198bf](https://github.com/zamanapp/hadid/commit/15198bf51b53e93825febb1277a06939104cf67c))

## [1.2.2](https://github.com/zamanapp/hadid/compare/v1.2.1...v1.2.2) (2025-05-29)


### Bug Fixes

* handle jpg file types ([ecfd194](https://github.com/zamanapp/hadid/commit/ecfd1946f8d796233ca96d7d9aec3d8c778c22e4))

## [1.2.1](https://github.com/zamanapp/hadid/compare/v1.2.0...v1.2.1) (2025-05-24)


### Bug Fixes

* wordlimit increase ([c9957cf](https://github.com/zamanapp/hadid/commit/c9957cf22ce6c5d8900b6014c409741e002fbc20))

# [1.2.0](https://github.com/zamanapp/hadid/compare/v1.1.0...v1.2.0) (2025-05-24)


### Features

* add tokenLimitPerPage option and truncate input text by word count ([aa3bc89](https://github.com/zamanapp/hadid/commit/aa3bc89acbc181882209976eba63028a742911ad))

# [1.1.0](https://github.com/zamanapp/hadid/compare/v1.0.0...v1.1.0) (2025-05-23)


### Features

* add publishConfig for public access in package.json ([1824cee](https://github.com/zamanapp/hadid/commit/1824cee43e6b5b60c2958703b6a2dea3fe02ccce))

# 1.0.0 (2025-05-23)


### Bug Fixes

* allow empty select_pages again ([#53](https://github.com/zamanapp/hadid/issues/53)) ([1411594](https://github.com/zamanapp/hadid/commit/1411594f4146628a7cb30d13456465f4b66658fb))
* page numbering when only converting specific pages ([48640be](https://github.com/zamanapp/hadid/commit/48640be5a4d31994f4c9519c2fa6a99f00be2f0a))
* pnpm version ([f7b5d52](https://github.com/zamanapp/hadid/commit/f7b5d522465a18aeb6b25120622d756a3e9b2034))
* prevent installation script from running in GitHub Actions ([b200de3](https://github.com/zamanapp/hadid/commit/b200de3ad998022ceeaf79fe619c07002d52b159))
* re-order params ([2a9932a](https://github.com/zamanapp/hadid/commit/2a9932a4b3dd768df1bc650c1440c0d4356afcad))
* re-order params ([7e0a6c3](https://github.com/zamanapp/hadid/commit/7e0a6c3b7cfd2054421d8e843680f7fd86237e84))
* spacing in README.md ([1d487fb](https://github.com/zamanapp/hadid/commit/1d487fb7f5a5338ac156cc43d31333e96a79928a))
* update build script to prevent TypeScript errors during compilation ([d34e870](https://github.com/zamanapp/hadid/commit/d34e870ec44574fd7c89cc7a850dd1f1dce03c23))
* update repository URLs and semantic release plugin versions in workflow ([85f117f](https://github.com/zamanapp/hadid/commit/85f117f8daf36098e913d5bec8943842616459ae))
* update repository URLs in package.json and pyproject.toml for consistency ([e68c76f](https://github.com/zamanapp/hadid/commit/e68c76f526400fcc663598b24a4eebbdb198a354))


### Features

* add semantic release configuration for automated versioning and changelog generation ([1f894c6](https://github.com/zamanapp/hadid/commit/1f894c6b926db076b3d951056c89fd8cdfd9e5f7))
* allow specifying page numbers ([2fb0aa0](https://github.com/zamanapp/hadid/commit/2fb0aa0851775a7130a31bf85b18cc587e03987b))
* enhance document conversion prompt and add spreadsheet test file ([237575c](https://github.com/zamanapp/hadid/commit/237575c832599af38b8f6014e57bcf452e24da1c))
* localise excel document processing to Markdown conversion and updating related parameters ([76d74e1](https://github.com/zamanapp/hadid/commit/76d74e10a203259516cc16291411ee92e5b73e29))
* Refactor PDF processing parameters and add HTML to Markdown conversion methods for various models ([a3d2817](https://github.com/zamanapp/hadid/commit/a3d2817bf2042e4dc32f24bd0e1cea06c3c14415))
