import '../visual/component/shared/base/sharedMessage';
import '../visual/component/shared/base/systemScreen';
import '../visual/component/shared/base/systemDialogs';
import registerBaseComponent, {
	defaultMap
} from '../visual/component/buildObj/registerBaseComponent';
import { global } from './___global';

export async function linkElements() {
	global.ui_collection = defaultMap;
	await registerBaseComponent();
}
