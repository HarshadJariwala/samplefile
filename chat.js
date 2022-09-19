import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
	View, Text, SafeAreaView, StyleSheet, ScrollView, TouchableOpacity, Image,
	TextInput, Modal, Dimensions, StatusBar, Platform, ToastAndroid, Keyboard
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-community/async-storage';
import AntDesign from 'react-native-vector-icons/AntDesign';
import * as SCREEN from '../../context/screen/screenName';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AUTHUSER } from '../../context/actions/type';
//
import { GiftedChat } from 'react-native-gifted-chat';
import { renderDay, renderBubble, renderInputToolbar } from './customChatProps';
import firestore from '@react-native-firebase/firestore';
//
import { EndChatService, FindChatById, StartChatService, StartProject } from '../../services/ChatService/ChatService';
import moment from 'moment';
const HEIGHT = Dimensions.get('window').height;
const WIDTH = Dimensions.get('window').width;
import Loader from '../../components/loader/index';
const noProfile = 'https://res.cloudinary.com/dnogrvbs2/image/upload/v1613538969/profile1_xspwoy.png';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import HelpSupportService from '../../services/HelpSupportService/HelpSupportService';
import * as UPLOADKEY from '../../context/actions/type';
import GeneralStatusBarColor from '../../components/StatusBarStyle/GeneralStatusBarColor';
import crashlytics, { firebase } from "@react-native-firebase/crashlytics";
import Spinner from 'react-native-loading-spinner-overlay';

const chatScreen = (props, { navigation }) => {
	//chat variable
	const consultanDetails = props.route.params.consultanDetails;
	let formId;
	const [spinnerLoader, setSpinnerLoader] = useState(false);
	const [loading, setloading] = useState(false);
	const [chatId, setchatId] = useState(null);
	const [sender, setsender] = useState(null);
	const [messages, setMessages] = useState([]);
	const [formdataDetails, setFormdataDetails] = useState(null);
	//another variable
	const [showStartProjectVisible, setshowStartProjectVisible] = useState(false);
	const [showMessageModalVisible, setshowMessageModalVisible] = useState(false);
	const [filterModalVisible, setfilterModalVisible] = useState(false);
	const [hideInput, setHideInput] = useState(false);
	const [projectTime, setProjectTime] = useState(null);
	const [projectTimeError, setProjectTimeError] = useState(null);
	const [projectdesc, setProjectdesc] = useState(null);
	const [projectdescError, setProjectdescError] = useState(null);
	const [projectMobile, setProjectMobile] = useState(null);
	const [projectMobileError, setProjectMobileError] = useState(null);
	const [isTimePickerVisibility, setIsTimePickerVisibility] = useState(false);
	const [showHelpSupportModel, setShowHelpSupportModel] = useState(false);
	const [showHelpSupportMessageModel, setShowHelpSupportMessageModel] = useState(false);
	const [reportSubject, setReportSubject] = useState(null);
	const [reportSubjectError, setReportSubjectError] = useState(null);
	const [reportDesc, setReportDesc] = useState(null);
	const [reportDescError, setReportDescError] = useState(null);
	const secondTextInputRef = React.createRef();
	const thirdTextInputRef = React.createRef();
	let userid;
	let formdatas;

	// chat portion
	useEffect(
		() => {
			AsyncStorage.getItem(AUTHUSER).then((res) => {
				let sender = JSON.parse(res)._id;
				userid = JSON.parse(res)._id;
				setsender(sender);
				setloading(true);
				newChat(sender, consultanDetails).then((id) => {
					setchatId(id);
					let getMessages = firestore()
						.collection('chat')
						.doc(id)
						.collection('messages')
						.orderBy('order', 'desc');
					getMessages.onSnapshot((snap) => {
						let messages = snap.docs.map((item) => item.data());
						setMessages(messages);
					});
				});
			});
		},
		[navigation]
	);

	useEffect(() => {
	}, [formdataDetails, hideInput, sender, chatId, projectTime, projectTimeError, projectdesc,
		projectdescError, projectMobile, projectMobileError, reportSubject, reportSubjectError,
		reportDesc, reportDescError, spinnerLoader
	])

	//check validation of subject
	const setReportSubjectCheck = (subject) => {
		if (!subject || subject <= 0) {
			return setReportSubjectError('subject cannot be empty');
		}
		setReportSubject(subject);
		setReportSubjectError(null);
		return;
	}

	//check validation of description
	const setReportDescriptionCheck = (description) => {
		if (!description || description <= 0) {
			return setReportDescError('description cannot be empty');
		}
		setReportDesc(description);
		setReportDescError(null);
		return;
	}

	const startChat = async (sender, item) => {
		const body = {
			formid: '608a5d7ebbeb5b2b03571f2c',
			contextid: item,
			onModel: "User",
			onModelAddedby: "Member",
			status: "active",
			addedby: sender,
			property: {
				consultantid: item,
				// category: consultanDetails && consultanDetails.property && consultanDetails.property.livechat ? consultanDetails.property.livechat : [],
				// subcategory: consultanDetails.property.skill
			}
		}
		try {
			const response = await StartChatService(body);
			if (response.data != null && response.data != 'undefind' && response.status === 200) {
				formId = response.data._id;
				formdatas = response.data;
				FindChatByIdService(response.data._id);
			}
		}
		catch (error) {
			firebase.crashlytics().recordError(error);
			//console.log(`error`, error);
			setloading(false);
		}
	}

	//new chat inite
	const newChat = async (sender, item) => {
		let getChatId = firestore().collection('chat');
		let snap = await getChatId.where('member', 'in', [[sender, item._id]]).get();
		if (snap.empty) {
			let snap2 = await getChatId.where('member', 'in', [[item._id, sender]]).get();
			if (snap2.empty) {
				await startChat(sender, item._id);
				let ref = await getChatId.add({
					member: [sender, item._id],
					createdAt: '',
					previewMessage: '',
					formid: formId,
					memberid: sender,
					userid: item._id
				});
				// setloading(false);
				updateChatdata(ref.id, sender, item._id);
				return ref.id;
			} else {
				FindChatByIdService(snap2.docs[0]._data.formid);
				setloading(false);
				return snap2.docs[0].id;
			}
		} else {
			FindChatByIdService(snap.docs[0]._data.formid);
			setloading(false);
			return snap.docs[0].id;
		}
	};

	//update chat id
	const updateChatdata = async (chatId, sender, consltid) => {
		let body = {
			formid: '608a5d7ebbeb5b2b03571f2c',
			// contextid: consltid,
			// onModel: "User",
			// onModelAddedby: "Member",
			// status: "active",
			// addedby: sender,
			property: {
				consultantid: consltid,
				chargable: false,
				// category: consultanDetails && consultanDetails.property && consultanDetails.property.livechat ? consultanDetails.property.livechat : [],
				// subcategory: consultanDetails.property.skill,
				fierbasechatid: chatId
			}
		}
		try {
			console.log(`body`, body);
			const response = await EndChatService(formdatas._id, body);
			console.log(`response.data`, response.data);
			if (response.data != null && response.data != 'undefind' && response.status == 200) {
				FindChatByIdService(response.data._id);
				if (Platform.OS === 'android') {
					ToastAndroid.show('Your Chat Is Initial', ToastAndroid.SHORT);
				} else {
					alert('Your Chat Is Initial');
				}
				setloading(false);
			}
		} catch (error) {
			console.log(`error`, error);
			firebase.crashlytics().recordError(error);
			setloading(false);
			if (Platform.OS === 'android') {
				ToastAndroid.show('Your Chat Not Initial', ToastAndroid.SHORT);
			} else {
				alert('Your Chat Is Not Initial');
			}
		}
	}

	//send btn click to send message 
	const onSend = useCallback((messages = []) => {
		sendpushalertmsgCheck(messages[0].text);
		let setMessage = firestore().collection('chat').doc(chatId).collection('messages').doc();
		for (let i = 0; i < messages.length; i++) {
			const { text, user, createdAt } = messages[i];
			firestore()
				.collection('chat')
				.doc(chatId)
				.update({ previewMessage: messages[0].text, createdAt: createdAt.toString() });
			const message = {
				_id: Math.random(),
				text,
				user,
				createdAt: createdAt.toString(),
				order: firestore.FieldValue.serverTimestamp(),
				sent: true,
				received: true,
				panding: false
			};
			setMessage.set(message);
		}
	});

	//open - close model popup
	const setFilterModalVisible = (visible) => {
		setfilterModalVisible(visible);
	};

	const showModalVisible = () => {
		setProjectTime(null);
		setProjectTimeError(null);
		setProjectdesc(null);
		setProjectdescError(null);
		setProjectMobile(null);
		setProjectMobileError(null);
	};

	const showModalVisibleSubmit = (visible) => {
		setshowStartProjectVisible(visible);
		setshowMessageModalVisible(true);
	};

	//current chat in find chat is end or not
	const FindChatByIdService = async (id) => {
		const response = await FindChatById(id);
		try {
			if (response.data != null && response.data != 'undefind' && response.status == 200) {
				setFormdataDetails(response.data[0]);
				if (response.data[0] && response.data[0].property.endat != null) {
					setHideInput(true);
				} else {
					setHideInput(false);
				}
			}
		} catch (error) {
			firebase.crashlytics().recordError(error);
			setloading(false);
		}
	}

	//call feedback form open
	const feedBack = async () => {
		setFilterModalVisible(false);
		props.navigation.navigate(SCREEN.RATEINGSCREEN, { consultanDetails, formdataDetails });
	}

	//check project time error message
	const setTimeCheck = (time) => {
		if (!time || time <= 0) {
			return setProjectTimeError('project time cannot be empty');
		}
		setProjectTime(time);
		setProjectTimeError(null);
		return;
	}

	//check project consultant Mobile error message
	const setMobileCheck = (mobile_number) => {
		const reg = /^\d{10}$/;
		if (!mobile_number || mobile_number.length <= 0) {
			setProjectMobile(mobile_number);
			setProjectMobileError('Mobile Number cannot be empty');
			return;
		}
		if (!reg.test(mobile_number)) {
			setProjectMobile(mobile_number);
			setProjectMobileError('Ooops! We need a valid Mobile Number');
			return;
		}
		setProjectMobile(mobile_number);
		setProjectMobileError(null);
		return;
	}

	//check project description error message
	const setDescriptionCheck = (projectdesc) => {
		if (!projectdesc || projectdesc <= 0) {
			return setProjectdescError('project desc cannot be empty');
		}
		setProjectdesc(projectdesc);
		setProjectdescError(null);
		return;
	}

	//start project submit button click to call
	const projectStart = async () => {
		if (!projectMobile || !projectTime || !projectdesc) {
			setTimeCheck(projectTime);
			setMobileCheck(projectMobile);
			setDescriptionCheck(projectdesc);
			return;
		}
		const body = {
			formid: '60a2233ddc53910facbc82d0',
			contextid: sender,
			onModel: 'Member',
			property: {
				time: projectTime,
				mobile_number: projectMobile,
				description: projectdesc,
				consultantid: consultanDetails._id
			}
		}
		setSpinnerLoader(true);
		try {
			const response = await StartProject(body);
			if (response.data != null && response.data != 'undefind' && response.status == 200) {
				setSpinnerLoader(false);
				showModalVisibleSubmit(!showStartProjectVisible);
				showModalVisible();
			}
		} catch (error) {
			console.log(`error`, error);
			firebase.crashlytics().recordError(error);
		}
	}

	//on touch to open time picker
	const showTimePicker = () => {
		setIsTimePickerVisibility(true);
	};

	//on touch cancel btn to close time picker
	const hideTimePicker = () => {
		setIsTimePickerVisibility(false);
	};

	//time picker in submit to select date
	const handleConfirmTime = (time) => {
		let datetime = moment(time).format()
		setProjectTime(datetime);
		hideTimePicker();
	};

	//help model pop up submit button touch to called
	const onPressReportIssues = async () => {
		if (!reportDesc || !reportSubject) {
			setReportSubjectCheck(reportSubject);
			setReportDescriptionCheck(reportDesc);
			return;
		}
		const body = {
			'status': 'Requested',
			'subject': reportSubject,
			'customerid': sender,
			'onModel': 'Member',
			'category': 'System Enhancements',
			'content': reportDesc
		}
		setSpinnerLoader(true);
		try {
			const response = await HelpSupportService(body);
			if (response.data != null && response.data != 'undefind' && response.status == 200) {
				setSpinnerLoader(false);
				setShowHelpSupportModel(false);
				setShowHelpSupportMessageModel(true);
				setReportSubject(null);
				setReportSubjectError(null);
				setReportDesc(null);
				setReportDescError(null);
			}
		}
		catch (error) {
			firebase.crashlytics().recordError(error);
			setloading(false);
		}
	}

	async function sendpushalert(registrationid, message, subject) {
		var form = {
			to: registrationid,
			priority: "high",
			notification: {
				sound: "default",
				title: subject.toLowerCase().split(' ').map(s => s.charAt(0).toUpperCase() + s.substring(1)).join(' '),
				body: message
			}
		};
		var formData = JSON.stringify(form);
		await fetch('https://fcm.googleapis.com/fcm/send', {
			method: 'POST',
			headers: {
				"Content-Type": "application/json",
				"Authorization": UPLOADKEY.MESSAGEKEY
			},
			body: formData
		})
			.then(response => response.json())
			.then((responseData) => {
				console.log('responseData', responseData);
			})
			.catch(error => {
				console.error('There was an error!', error);
			});
	}

	function sendpushalertmsgCheck(message) {
		let userInformation = formdataDetails.contextid;
		if (userInformation) {
			if (userInformation.anroiddevices && userInformation.anroiddevices.length !== 0) {
				userInformation.anroiddevices.forEach(elementAndroidDevices => {
					if (
						elementAndroidDevices.registrationid &&
						elementAndroidDevices.registrationid != ""
					)
						sendpushalert(elementAndroidDevices.registrationid, message, userInformation.fullname)
				});
			}

			if (userInformation.iosdevices && userInformation.iosdevices.length !== 0) {
				userInformation.iosdevices.forEach(elementIosDevices => {
					if (
						elementIosDevices.registrationid &&
						elementIosDevices.registrationid != ""
					)
						sendpushalert(elementIosDevices.registrationid, message, userInformation.fullname)
				});
			}
		}
	}

	return (
		<SafeAreaView style={styles.container}>
			{
				showStartProjectVisible || showMessageModalVisible || filterModalVisible || showHelpSupportModel || showHelpSupportMessageModel
					?
					<GeneralStatusBarColor hidden={false} translucent={true} backgroundColor="rgba(0,0,0,0.3)" barStyle="dark-content" />
					:
					<GeneralStatusBarColor hidden={false} translucent={true} backgroundColor="transparent" barStyle="dark-content" />
			}

			<View style={styles.headerstyle}>
				<View style={{ justifyContent: 'space-between', alignItems: 'center', flexDirection: 'row', marginTop: 20 }}>
					<View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', marginLeft: 20 }}>
						<TouchableOpacity onPress={() => props.navigation.goBack(null)}>
							<AntDesign name='arrowleft' color='#FFFFFF' size={24} />
						</TouchableOpacity>
						<Image
							source={{ uri: consultanDetails ? consultanDetails.profilepic !== null && consultanDetails.profilepic ? consultanDetails.profilepic : noProfile : noProfile }}
							style={{ width: 50, height: 52, borderRadius: 100, marginLeft: 5 }}
						/>
						<View style={{ justifyContent: 'flex-start', alignItems: 'flex-start', flexDirection: 'column', marginLeft: 10 }}>
							<Text style={{ fontSize: 18, color: '#FFFFFF', textTransform: 'capitalize' }}>{formdataDetails && formdataDetails.contextid && formdataDetails.contextid.fullname.split(' ')[0]}</Text>
							<Text style={{ fontSize: 12, color: '#000000', marginLeft: 0 }}>
								{formdataDetails && formdataDetails.contextid && formdataDetails.contextid.property && formdataDetails.contextid.property.live ? 'Online' : 'Ofline'}
							</Text>
						</View>
					</View>
					<View style={{ justifyContent: 'flex-end', marginRight: 20 }}>
						<TouchableOpacity onPress={() => props.navigation.navigate(SCREEN.HOMESCREEN)}>
							<Image source={require('../../assets/Images/homeicon.png')} style={{ height: 30, width: 30 }} />
						</TouchableOpacity>
					</View>
				</View>
				<View style={{
					flexDirection: 'row', justifyContent: 'space-between', marginTop: -5, marginLeft: 20, marginRight: 20,
				}}>
					<TouchableOpacity
						onPress={() => setshowStartProjectVisible(true)}
						style={{
							width: 140, height: 35, backgroundColor: '#FFFFFF', borderRadius: 100,
							alignItems: 'center', justifyContent: 'center', margin: 20,
							shadowColor: "#000000",
							shadowOffset: {
								width: 0,
								height: 2,
							},
							shadowOpacity: 0.23,
							shadowRadius: 2.62,
							elevation: 4,
						}}>
						<Text style={{ fontSize: 14, color: '#FFB629' }}>Start a Project</Text>
					</TouchableOpacity>
					<TouchableOpacity onPress={() => { setFilterModalVisible(true) }}
						style={{ alignItems: 'center', justifyContent: 'center' }}>
						<MaterialCommunityIcons name='dots-vertical-circle' size={30} color='#FFFFFF' />
					</TouchableOpacity>
				</View>
			</View>
			<ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps={'always'}>
				<View style={styles.centeView}>
					<View style={styles.chatview}>
						<GiftedChat
							keyboardShouldPersistTaps={'always'}
							user={{ _id: sender }}
							isAnimated={true}
							messages={messages}
							onSend={onSend}
							renderAvatar={null}
							alwaysShowSend={true}
							renderBubble={(props) => renderBubble(props, navigation)}
							//renderDay={renderDay}
							minInputToolbarHeight={80}
							renderInputToolbar={renderInputToolbar}
						/>
					</View>
				</View>
			</ScrollView>

			{/* start project model Pop */}
			<Modal
				animationType='slide'
				transparent={true}
				visible={showStartProjectVisible}
				onRequestClose={() => { setshowStartProjectVisible(!showStartProjectVisible) }}
			>
				<View style={{ alignItems: 'center', flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}>
					<View style={{ position: 'absolute', bottom: 20 }}>
						<View style={styles.modalView}>
							<View style={{ marginTop: 20 }} />
							<View style={projectTimeError == null ? styles.inputView : styles.inputViewError}>
								<TextInput
									style={styles.TextInput}
									selectionColor='#000000'
									placeholder='Best time to call'
									type='clear'
									returnKeyType='next'
									placeholderTextColor='#999999'
									defaultValue={projectTime && moment(projectTime).format('LT')}
									blurOnSubmit={false}
									onTouchStart={() => showTimePicker()}
									onSubmitEditing={() => secondTextInputRef.current.focus()}
									onChangeText={(time) => setTimeCheck(time)}
								/>
								<DateTimePickerModal
									isVisible={isTimePickerVisibility}
									mode="time"
									onConfirm={handleConfirmTime}
									onCancel={hideTimePicker}
								/>
								<TouchableOpacity onPress={() => showTimePicker()}>
									<Ionicons name='time-outline' size={24} color='#000000' style={{ marginRight: 5 }} />
								</TouchableOpacity>
							</View>
							<View style={projectMobileError == null ? styles.inputView : styles.inputViewError}>
								<TextInput
									style={styles.TextInput}
									placeholder='Your Phone Number'
									type='clear'
									selectionColor='#000000'
									returnKeyType='next'
									placeholderTextColor='#999999'
									keyboardType='number-pad'
									defaultValue={projectMobile}
									blurOnSubmit={false}
									ref={secondTextInputRef}
									maxLength={10}
									onSubmitEditing={() => thirdTextInputRef.current.focus()}
									onChangeText={(mobile) => setMobileCheck(mobile)}
								/>
							</View>
							<View style={projectdescError == null ? styles.textAreainputView : styles.textAreainputViewError}>
								<TextInput
									style={styles.TextareaInput}
									placeholder='Project Brief'
									type='clear'
									selectionColor='#000000'
									returnKeyType='done'
									placeholderTextColor='#999999'
									blurOnSubmit={false}
									numberOfLines={3}
									multiline={true}
									defaultValue={projectdesc}
									ref={thirdTextInputRef}
									onSubmitEditing={() => Keyboard.dismiss()}
									onChangeText={(description) => setDescriptionCheck(description)}
								/>
							</View>
						</View>
						<View style={{ marginTop: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
							<TouchableOpacity
								onPress={() => projectStart()}
								style={styles.savebtn}
							>
								<Text style={{ fontSize: 14, color: '#FFFFFF' }}>Submit</Text>
							</TouchableOpacity>
							<TouchableOpacity
								onPress={() => { setshowStartProjectVisible(!showStartProjectVisible), showModalVisible() }}
								style={styles.cancelbtn}
							>
								<Text style={{ fontSize: 14, color: '#000000' }}>Cancel</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			{/* message model Pop */}
			<Modal
				animationType='slide'
				transparent={true}
				visible={showMessageModalVisible}
				onRequestClose={() => { showMessageModalVisible(!showMessageModalVisible) }}
			>
				<View style={{ alignItems: 'center', flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}>
					<View style={{ position: 'absolute', bottom: 20 }}>
						<View style={styles.msgModalView}>
							<Text style={{ marginTop: 50, fontSize: 28, fontWeight: 'bold', color: '#000000' }}>Thank You</Text>
							<Text style={{ fontSize: 14, marginTop: 15, color: '#000000' }}>
								Someone from our team will reach
							</Text>
							<Text style={{ fontSize: 14, color: '#000000' }}>out to you</Text>
						</View>
						<View style={{ justifyContent: 'center', flexDirection: 'row', marginTop: 15 }}>
							<TouchableOpacity
								onPress={() => { setshowMessageModalVisible(false) }}
								style={styles.cancelbtn}
							>
								<Text style={{ fontSize: 14, color: '#000000' }}>Close</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			{/* Filter model Pop */}
			<Modal
				animationType='slide'
				transparent={true}
				visible={filterModalVisible}
				onRequestClose={() => setFilterModalVisible(!filterModalVisible)}
			>
				<View style={{ alignItems: 'center', flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}>
					<View style={{ position: 'absolute', bottom: 20 }}>
						<View style={styles.filterModelView}>
							<TouchableOpacity onPress={() => { setFilterModalVisible(!filterModalVisible), setShowHelpSupportModel(true) }}>
								<Text style={{ padding: 15, textAlign: 'center', color: '#000000' }}>
									Report an issue
								</Text>
							</TouchableOpacity>
							<View style={{ flexDirection: 'row' }}>
								<View style={{ flex: 1, height: 1, backgroundColor: '#EEEEEE' }} />
							</View>

							<TouchableOpacity onPress={() => feedBack()}>
								<Text style={{ padding: 15, textAlign: 'center', color: '#000000' }}>Rate</Text>
							</TouchableOpacity>
							<View style={{ flexDirection: 'row' }}>
								<View style={{ flex: 1, height: 1, backgroundColor: '#EEEEEE' }} />
							</View>
						</View>
						<View style={{ marginTop: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
							<TouchableOpacity
								onPress={() => setFilterModalVisible(!filterModalVisible)}
								style={styles.cancelbtn}
							>
								<Text style={{ fontSize: 14, color: '#000000' }}>Cancel</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			{/* report issues model Pop */}
			<Modal
				animationType='slide'
				transparent={true}
				visible={showHelpSupportModel}
				onRequestClose={() => setShowHelpSupportModel(!showHelpSupportModel)}
			>
				<View style={{ alignItems: 'center', flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}>
					<View style={{ position: 'absolute', bottom: 20 }}>
						<View style={styles.helpSupportModalView}>
							<View style={{ marginTop: 20 }}></View>
							<View style={reportSubjectError == null ? styles.inputView : styles.inputViewError}>
								<TextInput
									style={styles.TextInput}
									placeholder='Subject'
									type='clear'
									returnKeyType='next'
									placeholderTextColor='#999999'
									defaultValue={reportSubject}
									blurOnSubmit={false}
									onSubmitEditing={() => secondTextInputRef.current.focus()}
									onChangeText={(subject) => setReportSubjectCheck(subject)}
								/>
							</View>
							<View style={reportDescError == null ? styles.textAreainputView : styles.textAreainputViewError}>
								<TextInput
									style={styles.TextareaInput}
									placeholder='Write Your Descripation'
									type='clear'
									returnKeyType='done'
									placeholderTextColor='#999999'
									blurOnSubmit={false}
									numberOfLines={3}
									multiline={true}
									defaultValue={setReportDesc}
									ref={secondTextInputRef}
									onChangeText={(description) => setReportDescriptionCheck(description)}
								/>
							</View>
						</View>
						<View style={{ marginTop: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
							<TouchableOpacity onPress={() => onPressReportIssues()}
								style={styles.savebtn}>
								<Text style={{ fontSize: 14, color: '#FFFFFF' }}>Submit</Text>
							</TouchableOpacity>
							<TouchableOpacity onPress={() => {
								setReportSubject(null),
									setReportSubjectError(null),
									setReportDesc(null),
									setReportDescError(null),
									setShowHelpSupportModel(false)
							}}
								style={styles.cancelbtn}>
								<Text style={{ fontSize: 14, color: '#000000' }}>Cancel</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			{/* help support message model Pop */}
			<Modal
				animationType='slide'
				transparent={true}
				visible={showHelpSupportMessageModel}
				onRequestClose={() => setShowHelpSupportMessageModel(!showHelpSupportMessageModel)}
			>
				<View style={{ alignItems: 'center', flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}>
					<View style={{ position: 'absolute', bottom: 20 }}>
						<View style={styles.msgModalView}>
							<Image source={require('../../assets/Images/smileicon.png')} style={{ marginTop: 35, height: 40, width: 40 }} />
							<Text style={{ marginTop: 15, fontSize: 14, color: '#000000' }}>Thank you for your feedback</Text>
							<Text style={{ fontSize: 14, color: '#000000' }}>we will get back to you shortly</Text>
						</View>
						<View style={{ justifyContent: 'center', flexDirection: 'row', marginTop: 15 }}>
							<TouchableOpacity onPress={() => setShowHelpSupportMessageModel(!showHelpSupportMessageModel)}
								style={styles.cancelbtn}>
								<Text style={{ fontSize: 14, color: '#000000' }}>Ok</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
			{loading ? <Loader /> : null}
			{spinnerLoader ? <Spinner visible={spinnerLoader} color='#00D9CE' /> : null}
		</SafeAreaView>
	);
};

export default chatScreen;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFB629'
	},
	chatview: {
		width: WIDTH - 20,
		backgroundColor: '#FFFFFF',
		borderRadius: 30,
		height: HEIGHT * 0.8,
		shadowColor: "#000000",
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.23,
		shadowRadius: 2.62,
		elevation: 4,
		marginBottom: 10,
	},
	chatIcon: {
		width: 40,
		height: 40,
		borderRadius: 100,
	},
	inputview: {
		flexDirection: 'row',
		backgroundColor: '#fff',
		borderColor: '#737373',
		shadowOpacity: 0.5,
		shadowRadius: 2,
		shadowOffset: {
			height: 0,
			width: 0
		},
		elevation: 2,
		width: WIDTH - 120,
		height: 40,
		borderRadius: 10,
		alignItems: 'center',
		justifyContent: 'center'
	},
	inputtext: {
		fontSize: 16,
		flex: 1,
		marginLeft: 30
	},
	centerView: {
		justifyContent: 'center',
		alignItems: 'center'
	},
	msgModalView: {
		height: 200,
		width: WIDTH - 90,
		borderRadius: 20,
		backgroundColor: 'white',
		alignItems: 'center',
		shadowColor: '#000000',
		shadowOffset: {
			width: 0,
			height: 2
		},
		shadowOpacity: 0.25,
		shadowRadius: 1,
		elevation: 1
	},
	timeoutModalView: {
		height: 100,
		width: WIDTH - 90,
		borderRadius: 20,
		backgroundColor: '#EEEEEE',
		alignItems: 'center',
		shadowColor: '#EEEEEE',
		shadowOffset: {
			width: 0,
			height: 2
		},
		shadowOpacity: 0.25,
		shadowRadius: 1,
		elevation: 1,
		borderColor: '#FFB629',
		borderWidth: 1
	},
	filterModelView: {
		flex: 1,
		width: WIDTH - 90,
		borderRadius: 20,
		backgroundColor: 'white',
		alignItems: 'center',
		shadowColor: '#000000',
		shadowOffset: {
			width: 0,
			height: 2
		},
		shadowOpacity: 0.25,
		shadowRadius: 4,
		elevation: 5
	},
	modalView: {
		height: 250,
		width: WIDTH - 90,
		borderRadius: 20,
		backgroundColor: 'white',
		alignItems: 'center',
		shadowColor: '#000000',
		shadowOffset: {
			width: 0,
			height: 2
		},
		shadowOpacity: 0.25,
		shadowRadius: 4,
		elevation: 5
	},
	helpSupportModalView: {
		height: 200,
		width: WIDTH - 90,
		borderRadius: 20,
		backgroundColor: 'white',
		alignItems: 'center',
		shadowColor: '#000000',
		shadowOffset: {
			width: 0,
			height: 2
		},
		shadowOpacity: 0.25,
		shadowRadius: 4,
		elevation: 5
	},
	disputeModalView: {
		height: 270,
		width: WIDTH - 90,
		borderRadius: 20,
		backgroundColor: 'white',
		alignItems: 'center',
		shadowColor: '#000000',
		shadowOffset: {
			width: 0,
			height: 2
		},
		shadowOpacity: 0.25,
		shadowRadius: 4,
		elevation: 5
	},
	savebtn: {
		flexDirection: 'row',
		marginLeft: 10,
		width: WIDTH / 3,
		height: 35,
		backgroundColor: '#FFB629',
		borderRadius: 20,
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5
	},
	cancelbtn: {
		flexDirection: 'row',
		width: WIDTH / 3,
		height: 35,
		marginRight: 10,
		backgroundColor: '#EEEEEE',
		borderRadius: 20,
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5
	},
	inputView: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#F4F4F4',
		borderWidth: 0.5,
		borderColor: '#000000',
		width: WIDTH - 120,
		height: 40,
		borderRadius: 5,
		marginBottom: 20
	},
	inputViewError: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#F4F4F4',
		borderWidth: 0.5,
		borderColor: '#FF0000',
		width: WIDTH - 120,
		height: 40,
		borderRadius: 5,
		marginBottom: 20,
		borderWidth: 1
	},
	TextInput: {
		fontSize: 14,
		flex: 1,
		backgroundColor: '#F4F4F4',
		marginLeft: 5,
		color: '#000000'
	},
	textAreainputView: {
		flexDirection: 'row',
		backgroundColor: '#F4F4F4',
		borderWidth: 0.5,
		borderColor: '#000000',
		width: WIDTH - 120,
		height: 100,
		borderRadius: 5,
		marginBottom: 5
	},
	textAreainputViewError: {
		flexDirection: 'row',
		backgroundColor: '#F4F4F4',
		borderWidth: 0.5,
		borderColor: '#FF0000',
		width: WIDTH - 120,
		height: 100,
		borderRadius: 5,
		borderWidth: 1,
		marginBottom: 5
	},
	TextareaInput: {
		fontSize: 14,
		flex: 1,
		backgroundColor: '#F4F4F4',
		marginLeft: 5,
		color: '#000000'
	},
	centeView: {
		justifyContent: 'center',
		alignItems: 'center'
	},
	headerstyle: {
		backgroundColor: '#FFB629',
		width: WIDTH,
		height: 150,
		borderBottomLeftRadius: 35,
		borderBottomRightRadius: 35
	},
	EndChatModalView: {
		marginTop: 10,
		height: HEIGHT - 80,
		width: WIDTH - 40,
		borderRadius: 20,
		backgroundColor: 'white',
		alignItems: 'center',
	},
	messageModalView: {
		marginTop: 10,
		height: 130,
		width: WIDTH - 90,
		borderRadius: 40,
		backgroundColor: '#5AC8FA',
		alignItems: 'center',
		shadowColor: '#000000',
	},
	profileImageView: {
		marginTop: 5,
		borderRadius: 30,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#FFFFFF',
		width: 80,
		height: 80,
		shadowOffset: {
			width: 2,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 2,
		borderRadius: 100,
		borderColor: '#000000'
	},
	profileImage: {
		borderRadius: 100,
		alignItems: 'center',
		backgroundColor: '#FFFFFF',
		width: 90,
		height: 90
	},
	commectView: {
		marginTop: 5,
		flexDirection: 'row',
		backgroundColor: '#F4F4F4',
		borderWidth: 0.5,
		borderColor: '#000000',
		width: WIDTH - 120,
		height: HEIGHT / 7,
		borderRadius: 5
	},
	doneBtn: {
		width: WIDTH / 2,
		height: 45,
		backgroundColor: '#5AC8FA',
		borderRadius: 20,
		alignItems: 'center',
		justifyContent: 'center',
		borderColor: '#5EA2FC',
		borderWidth: 0.5
	},
	yesbtn: {
		flexDirection: 'row',
		width: WIDTH / 6,
		height: 25,
		marginHorizontal: 20,
		backgroundColor: '#FFB629',
		borderRadius: 20,
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 1
	},
	nobtn: {
		flexDirection: 'row',
		width: WIDTH / 6,
		height: 25,
		backgroundColor: '#AAAAAA',
		borderRadius: 20,
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 1
	},
});
