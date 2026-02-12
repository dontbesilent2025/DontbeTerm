cask "dontbeterm" do
  version "1.2.0"
  sha256 arm:   "PLACEHOLDER_ARM64_SHA256",
         intel: "PLACEHOLDER_X64_SHA256"

  url "https://github.com/dontbesilent2025/DontbeTerm/releases/download/v#{version}/DontbeTerm-#{version}-#{Hardware::CPU.arch}.dmg"
  name "DontbeTerm"
  desc "Multi-session terminal manager for Claude Code with smart tab naming"
  homepage "https://github.com/dontbesilent2025/DontbeTerm"

  livecheck do
    url :url
    strategy :github_latest
  end

  app "DontbeTerm.app"

  postflight do
    # Remove quarantine attribute
    system_command "/usr/bin/xattr",
                   args: ["-cr", "#{appdir}/DontbeTerm.app"],
                   sudo: false
  end

  zap trash: [
    "~/Library/Application Support/DontbeTerm",
    "~/Library/Preferences/com.dontbeterm.app.plist",
    "~/Library/Saved Application State/com.dontbeterm.app.savedState",
  ]
end
