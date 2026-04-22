const { exec } = require("child_process");
const { promisify } = require("util");
const fs = require("fs");

const execPromise = promisify(exec);

const readOsRelease = () => {
  try {
    return fs.readFileSync("/etc/os-release", "utf8");
  } catch {
    return "";
  }
};

const isAlpineLinux = () => {
  if (process.platform !== "linux") return false;
  const osRelease = readOsRelease();
  return /(^|\n)ID=alpine(\n|$)/.test(osRelease);
};

const installPackage = async (command, packageName) => {
  try {
    const { stdout } = await execPromise(command);
    return stdout;
  } catch (error) {
    throw new Error(`Failed to install ${packageName}: ${error.message}`);
  }
};

const isSudoAvailable = async () => {
  try {
    // Try running a sudo command
    await execPromise("sudo -n true");
    return true;
  } catch {
    return false;
  }
};

const checkAndInstall = async () => {
  try {
    const sudoAvailable = await isSudoAvailable();
    const alpine = isAlpineLinux();

    // Check and install Ghostscript
    try {
      await execPromise("gs --version");
    } catch {
      if (process.platform === "darwin") {
        await installPackage("brew install ghostscript", "Ghostscript");
      } else if (process.platform === "linux") {
        const command = alpine
          ? sudoAvailable
            ? "sudo apk add --no-cache ghostscript"
            : "apk add --no-cache ghostscript"
          : sudoAvailable
            ? "sudo apt-get update && sudo apt-get install -y ghostscript"
            : "apt-get update && apt-get install -y ghostscript";
        await installPackage(command, "Ghostscript");
      } else {
        throw new Error(
          "Please install Ghostscript manually from https://www.ghostscript.com/download.html"
        );
      }
    }

    // Check and install GraphicsMagick
    try {
      await execPromise("gm -version");
    } catch {
      if (process.platform === "darwin") {
        await installPackage("brew install graphicsmagick", "GraphicsMagick");
      } else if (process.platform === "linux") {
        const command = alpine
          ? sudoAvailable
            ? "sudo apk add --no-cache graphicsmagick"
            : "apk add --no-cache graphicsmagick"
          : sudoAvailable
            ? "sudo apt-get update && sudo apt-get install -y graphicsmagick"
            : "apt-get update && apt-get install -y graphicsmagick";
        await installPackage(command, "GraphicsMagick");
      } else {
        throw new Error(
          "Please install GraphicsMagick manually from http://www.graphicsmagick.org/download.html"
        );
      }
    }

    // Check and install LibreOffice
    try {
      await execPromise("soffice --version");
    } catch {
      if (process.platform === "darwin") {
        await installPackage("brew install --cask libreoffice", "LibreOffice");
      } else if (process.platform === "linux") {
        const command = alpine
          ? sudoAvailable
            ? "sudo apk add --no-cache libreoffice"
            : "apk add --no-cache libreoffice"
          : sudoAvailable
            ? "sudo apt-get update && sudo apt-get install -y libreoffice"
            : "apt-get update && apt-get install -y libreoffice";
        await installPackage(command, "LibreOffice");
      } else {
        throw new Error(
          "Please install LibreOffice manually from https://www.libreoffice.org/download/download/"
        );
      }
    }

    // Check and install Poppler
    try {
      await execPromise("pdfinfo -v || pdftoppm -v");
    } catch {
      if (process.platform === "darwin") {
        await installPackage("brew install poppler", "Poppler");
      } else if (process.platform === "linux") {
        const command = alpine
          ? sudoAvailable
            ? "sudo apk add --no-cache poppler-utils"
            : "apk add --no-cache poppler-utils"
          : sudoAvailable
            ? "sudo apt-get update && sudo apt-get install -y poppler-utils"
            : "apt-get update && apt-get install -y poppler-utils";
        await installPackage(command, "Poppler");
      } else {
        throw new Error(
          "Please install Poppler manually from https://poppler.freedesktop.org/"
        );
      }
    }
  } catch (err) {
    console.error(`Error during installation: ${err.message}`);
    process.exit(1);
  }
};

if (process.env.GITHUB_ACTIONS !== "true") {
  checkAndInstall();
}
