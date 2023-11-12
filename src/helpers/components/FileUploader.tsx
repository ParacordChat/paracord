import { ChangeEvent, useState } from "preact/compat";
import "../../views/styles/fileUpload.css";

export default function FileUploader(props: {
  addFiles: (files: File[]) => void;
  uiInteractive: boolean;
}) {
	const { addFiles, uiInteractive } = props;
	const [fileInputKey, setFileInputKey] = useState(0);

	const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
		const input = e.target as HTMLInputElement;
		if (input.files) {
			const files = [...input.files];
			addFiles(files);
			setFileInputKey((ipk) => ipk + 1);
		}
	};

	return (
		<label className="fileLabel" htmlFor="fileInput">
			<div className="fileDiv">Click or drop something here to upload</div>
			<input
				type="file"
				id="fileInput"
				key={fileInputKey}
				accept="*"
				multiple
				required
				disabled={!uiInteractive}
				onChange={handleFileInputChange}
			/>
		</label>
	);
}
