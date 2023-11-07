import { Box, Heading, InfiniteScroll, Paragraph } from "grommet";
import CollapsibleContainer from "../../helpers/components/Collapsible";
import GenericHeader from "../../helpers/components/GenericHeader";

const abouts = [
	{
		title: "What is Paracord?",
		more: `Paracord is a secure chat program intended to be as easy to use as possible. It abstracts away any possible confusable ambiguity in order to increase compatability in conversations between laypeople and those who are more privacy-centric. I've found people who are squarely in the privacy camp have typically expect you to at least have signal, but most people don't want to install stuff. If you don't want to use zoom, setting up a JAMI instance isn't too easy either(there is a small subset of people reading this with a smug smirk, yes you know about the buttons to push to get a JAMI instance. Enjoy your power bills). For the rest of us, a link is the best solution. But every time without fail, providers have constantly let us down with leaked data and the sort of antics you wouldn't expect of a major corporation. For that reason we don't store data. We do matchmaking instead. You may be of the age that still remembers peer to peer matchmaking, gamespy, goldsource and the sort. All we know is that you'd like to talk. That's it. No phone numbers, no storage permissions. Gone forever when you hit x. As it should be.`
	},
	{
		title: "Is it secure?",
		more: "I wouldn't use it otherwise if I wasn't sure. My confidence could be misplaced, I wouldn't be the first. But this is more secure than most other options out there. This uses the NIST-approved KYBER-crystals postquantum cryptography standard to synchronize messages. This is on top of the known-secure(and quantum resistant) AES algorithm. Needless to say, this is more secure than a certain ghost-shaped messenger that stores your messages in plaintext, forever. Or others that don't know what you're saying but would very much like to know your contacts."
	},

	{
		title: `Is it secure - addendum "Dig it!"`,
		more: "This site is fully open source and hosted at https://github.com/ParacordChat/paracord, try using the dig command, and you can verify that the IP matches the one that github uses. Therefore you can be sure that the code you're running is the same as the code that's on github. If you're still not convinced, you can download the code and run it locally."
	},

	{
		title: "Why did you make it?",
		more: "I was tired of the usual rigamarole of video-call hot potato, as well as the lack of privacy-respecting file-sharing programs on the net that don't require hundreds of precious hours away from touchable grass"
	},

	{
		title: "Disclaimer",
		more: `
  Interpretation and Definitions
Interpretation

The words of which the initial letter is capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.
Definitions

For the purposes of this Disclaimer:

    Project (referred to as either "the Project", "We", "Us" or "Our" in this Disclaimer) refers to Paracord.
    Service refers to the Website.
    You means the individual accessing the Service, or the company, or other legal entity on behalf of which such individual is accessing or using the Service, as applicable.
    Website refers to Paracord, accessible from https://paracordchat.github.io/paracord/

The information contained on the Service is for general information purposes only.

The Project assumes no responsibility for errors or omissions in the contents of the Service.

In no event shall the Project be liable for any special, direct, indirect, consequential, or incidental damages or any damages whatsoever, whether in an action of contract, negligence or other tort, arising out of or in connection with the use of the Service or the contents of the Service. The Project reserves the right to make additions, deletions, or modifications to the contents on the Service at any time without prior notice.

The Project does not warrant that the Service is free of viruses or other harmful components.
External Links Disclaimer

The Service may contain links to external websites that are not provided or maintained by or in any way affiliated with the Project.

Please note that the Project does not guarantee the accuracy, relevance, timeliness, or completeness of any information on these external websites.
Errors and Omissions Disclaimer

The information given by the Service is for general guidance on matters of interest only. Even if the Project takes every precaution to insure that the content of the Service is both current and accurate, errors can occur. Plus, given the changing nature of laws, rules and regulations, there may be delays, omissions or inaccuracies in the information contained on the Service.

The Project is not responsible for any errors or omissions, or for the results obtained from the use of this information.
Views Expressed Disclaimer

The Service may contain views and opinions which are those of the authors and do not necessarily reflect the official policy or position of any other author, agency, organization, employer or company, including the Project.

Messages sent by users are their sole responsibility and the users will take full responsibility, liability and blame for any libel or litigation that results from something written in or as a direct result of something written in a message. The Project is not liable for any messages sent by users.
No Responsibility Disclaimer

In no event shall the Project or its suppliers be liable for any special, incidental, indirect, or consequential damages whatsoever arising out of or in connection with your access or use or inability to access or use the Service.
"Use at Your Own Risk" Disclaimer

All information in the Service is provided "as is", with no guarantee of completeness, accuracy, timeliness or of the results obtained from the use of this information, and without warranty of any kind, express or implied, including, but not limited to warranties of performance, merchantability and fitness for a particular purpose.

The Project will not be liable to You or anyone else for any decision made or action taken in reliance on the information given by the Service or for any consequential, special or similar damages, even if advised of the possibility of such damages.
  
  `
	}
];

export default function About() {
	return (
		<GenericHeader>
			<Box
				pad="large"
				gap="medium"
				width="large"
				border={{
					color: "brand",
					size: "large"
					
				}}
				background="dark-1"
				round="medium"
				alignSelf="center"
			>
				<Heading margin="none">About</Heading>
				<InfiniteScroll items={abouts}>
					{(item: { title: string; more: string }) => (
						<CollapsibleContainer
							style={{
								padding: "1rem 1.2rem"
							}}
							title={item.title}
						>
							<Paragraph>{item.more}</Paragraph>
						</CollapsibleContainer>
					)}
				</InfiniteScroll>
			</Box>
		</GenericHeader>
	);
}
