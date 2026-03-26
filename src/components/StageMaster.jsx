function StageMaster({ level }) {
  // Use a predictable seed like 'stage_1', 'stage_2'... for consistency per level
  const seed = `stage_${level}`;
  // 9.x version of DiceBear Pixel Art API
  const avatarUrl = `https://api.dicebear.com/9.x/pixel-art/svg?seed=${seed}&size=150`;

  return (
    <div className="stage-master-container">
      <img src={avatarUrl} alt={`Stage ${level} Master`} className="stage-master-img" />
    </div>
  );
}

export default StageMaster;
