import { Image } from "react-native";
import papersmellLogo from "../../assets/papersmell-logo.png";

type Props = {
  size?: number;
};

export function BrandMark({ size = 40 }: Props) {
  return (
    <Image
      alt=""
      accessible={false}
      resizeMode="contain"
      source={papersmellLogo}
      style={{ width: size, height: size }}
    />
  );
}
