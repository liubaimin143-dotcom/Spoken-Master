import './WatercolorBackground.css';

// 导入水彩背景图片
import watercolor1 from '../../assets/watercolor/素材1.png';
import watercolor2 from '../../assets/watercolor/素材2.png';
import watercolor3 from '../../assets/watercolor/素材3.png';

export function WatercolorBackground() {
    return (
        <>
            <div className="watercolor-1">
                <img src={watercolor1} alt="" />
            </div>
            <div className="watercolor-2">
                <img src={watercolor2} alt="" />
            </div>
            <div className="watercolor-3">
                <img src={watercolor3} alt="" />
            </div>
        </>
    );
}

export default WatercolorBackground;
