import { Box, Heading, Image, Text } from "grommet";
import GenericHeader from "../../helpers/components/GenericHeader";
import emailDisp from "/email.png";

export default function Enterprise() {
	return (
		<GenericHeader>
			<Box
				pad="large"
				gap="medium"
				width="Xlarge"
				border={{
					color: "brand",
					size: "large"
				}}
				background="dark-1"
				round="medium"
				alignSelf="center"
			>
				<Heading margin="none">Paracord for enterprise</Heading>
				<Text size="medium">
          Paracord is a free, open source, and easy to use video conferencing,
          chat and file sharing solution. Unlike most others, we focus on a
          seamless experience across browsers, pushing each to its limits to
          deliver a superior experience and ironclad quantum resistant
          encryption. In addition to our free version, we provide an enterprise
          package that includes dedicated STUN/TURN, for superior
          regional/global delivery, insuring you control the communications
          infrastructure and have maximum control over what little metadata
          exists. We allow payment in a variety of currencies, if you&apos;re
          interested in doing business, please contact us at the email below.
          Our codebase is designed to be as transparent and auditable as
          possible, we can walk you through it, as well as our
          uninterceptability guarantee.
				</Text>
				<Image
					style={{ width: "20em", margin: "0 auto", paddingBottom: "3em" }}
					src={emailDisp}
				/>
			</Box>
		</GenericHeader>
	);
}
