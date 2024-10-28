import { NextPage } from 'next';
import API, { SERVER_URL } from '../services/api';

interface Props {
	lights: {};
}

const ControlPanel: NextPage<Props> = (props: Props) => {


	function authorizeSpotify() {
		location.assign(`${SERVER_URL}/me/auth-spotify`);
	}


	return (
		<div>
			<div>
				<h1> Services </h1>
				<div>
					<h2>Spotify</h2>
					<button onClick={authorizeSpotify}> Auth Spotify </button>
				</div>

			</div>



			<p> Lights </p>
			{Object.values(props.lights).map((light: any) => <div key={light.uniqueid}> {light.name} </div>)}

		</div>
	);
}


export async function getServerSideProps() {
	const data = await API.getLights();

	return {
		props: {
			lights: data,
		}
	}
}



export default ControlPanel;
