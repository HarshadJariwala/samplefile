import React, { useEffect, useState } from 'react';
import {
    View, Text, Dimensions, SafeAreaView, ImageBackground,
    Image, TextInput, ScrollView, TouchableOpacity, StatusBar, Keyboard
} from 'react-native';
import * as SCREEN from '../../context/screen/screenName';
import * as COLOR from '../../styles/colors';
import * as FONT from '../../styles/typography';
import * as KEY from '../../context/actions/key';
import * as IMAGE from '../../styles/image';
import AsyncStorage from '@react-native-community/async-storage';
import { REMOTEDATA } from '../../context/actions/type';
const WIDTH = Dimensions.get('window').width;
const HEIGHT = Dimensions.get('window').height;
import STYLES from './Style';
import Toast from 'react-native-simple-toast';
import axiosConfig from '../../helpers/axiosConfig';
import { LoginService } from '../../services/LoginService/LoginService';
import Loader from '../../components/loader/index';
import crashlytics, { firebase } from "@react-native-firebase/crashlytics";

export default LoginScreen = (props) => {
    const [logo, setLogo] = useState(null);
    const [backgroungImage, setBackgroungImage] = useState(null);
    const [appLogoVisible, setAppLogoVisible] = useState(false);
    const [username, setUsername] = useState(null);
    const [password, setPassword] = useState(null);
    const [usernameError, setUsernameError] = useState(null);
    const [passwordError, setPasswordError] = useState(null);
    const [loading, setLoading] = useState(false);
    const secondTextInputRef = React.createRef();
    const [explore, setExplore] = useState(false);
    const [loginOTP, setLoginOTP] = useState(false);

    useEffect(() => {
        // check AuthController use to Login Or Not Login
        RemoteController();
    }, []);

    async function RemoteController() {
        var getUser = await AsyncStorage.getItem(REMOTEDATA);
        var userData = JSON.parse(getUser);
        if (userData) {
            setLogo(userData.applogo)
            setBackgroungImage(userData.loginimage)
            setAppLogoVisible(userData.applogovisibleloginscreen)
            setLoginOTP(userData.loginotp ? true : false);
            setExplore(userData.exploreimage != null ? true : false);
        }
    };

    //check email validation
    const CheckUsername = (username) => {
        if (!username || username.length <= 0) {
            setUsername(null);
            setUsernameError('Username Required!');
            return;
        }
        setUsername(username);
        setUsernameError(null);
        return;
    }

    //check password validation
    const CheckPassword = (password) => {
        if (!password || password.length <= 0) {
            setPassword(null);
            setPasswordError('Password Required!');
            return;
        }
        setPassword(password);
        setPasswordError(null);
        return;
    }

    //add local storage Records
    const authenticateUser = (member) => (
        AsyncStorage.setItem(KEY.AUTHUSER, JSON.stringify(member))
    )

    //add local storage Records
    const setAuthUserInfo = (credentials) => (
        AsyncStorage.setItem(KEY.AUTHUSERINFO, JSON.stringify(credentials))
    )

    const onPressToLogin = async () => {
        if (!username || !password) {
            CheckUsername(username);
            CheckPassword(password);
            return;
        }
        const body = {
            username: username.toUpperCase(),
            password: password
        }
        setLoading(true);
        Keyboard.dismiss();
        try {
            const response = await LoginService(body);
            if (response.data != null && response.data != 'undefind' && response.status == 200) {
                authenticateUser(response.data.user);
                setAuthUserInfo(body);
                let token = response.data.user._id;
                //set header auth user key
                axiosConfig(token);
                resetScreen();
                props.navigation.replace(SCREEN.TABNAVIGATION);
                Toast.show('Login Sucessfully', Toast.SHORT);
            }
        } catch (error) {
            firebase.crashlytics().recordError(error);
            setPassword(null);
            setPasswordError(null);
            setLoading(false);
            Toast.show('Username and Password Invalid!', Toast.SHORT);
        }
    }

    //clear Field up data
    const resetScreen = () => {
        setUsername(null);
        setUsernameError(null);
        setPassword(null);
        setPasswordError(null);
        setLoading(false);
    }

    //LOGIN WITH OTP FUNCTION
    const onPressToLoginOTP = () => {
        props.navigation.navigate(SCREEN.LOGINWITHOTP);
    }

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <StatusBar hidden={false} translucent={false} backgroundColor={COLOR.STATUSBARCOLOR} barStyle={KEY.DARK_CONTENT} />
            <ImageBackground source={backgroungImage ? { uri: backgroungImage } : IMAGE.BACKGROUND_IMAGE} resizeMode={KEY.COVER} style={STYLES.backgroundImage} >
                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps={KEY.ALWAYS}>
                    <View style={STYLES.containerView}>
                        {appLogoVisible ?
                            <Image source={logo ? { uri: logo } : IMAGE.MEMBROZ_LOGO} resizeMode={KEY.COVER}
                                style={STYLES.imageLogo} /> :
                            <View style={{ marginTop: HEIGHT / 3 }} />
                        }

                        <Text style={STYLES.welcomeText}>Welcome</Text>
                        <Text style={{ color: COLOR.WHITE, fontSize: 18, fontWeight: FONT.FONT_WEIGHT_BOLD, marginBottom: 45 }}>Login To Your Account</Text>

                        <View>
                            <TextInput placeholder={KEY.USERNAME}
                                placeholderTextColor={COLOR.WHITE}
                                selectionColor={COLOR.BLACK}
                                returnKeyType={KEY.NEXT}
                                style={!usernameError ? STYLES.inputTextView : STYLES.inputTextViewError}
                                defaultValue={username}
                                onSubmitEditing={() => secondTextInputRef.current.focus()}
                                onChangeText={(username) => CheckUsername(username)}
                            />
                            <Text style={{ marginLeft: 35, fontSize: FONT.FONT_SIZE_16, color: COLOR.ERRORCOLOR }}>{usernameError}</Text>
                        </View>
                        <View>
                            <TextInput placeholder={KEY.PASSWORD}
                                placeholderTextColor={COLOR.WHITE}
                                selectionColor={COLOR.BLACK}
                                returnKeyType={KEY.DONE}
                                style={!passwordError ? STYLES.inputTextView : STYLES.inputTextViewError}
                                secureTextEntry={true}
                                defaultValue={password}
                                blurOnSubmit={false}
                                ref={secondTextInputRef}
                                onSubmitEditing={() => { Keyboard.dismiss(), onPressToLogin() }}
                                onChangeText={(password) => CheckPassword(password)}
                            />
                            <Text style={{ marginLeft: 35, fontSize: FONT.FONT_SIZE_16, color: COLOR.ERRORCOLOR }}>{passwordError}</Text>
                        </View>

                        <TouchableOpacity style={STYLES.loginBtn} onPress={() => onPressToLogin()}>
                            <Text style={{ fontWeight: FONT.FONT_WEIGHT_BOLD, color: COLOR.WHITE, fontSize: FONT.FONT_SIZE_18 }}>Login</Text>
                        </TouchableOpacity>
                        {
                            loginOTP &&
                            <TouchableOpacity style={STYLES.loginBtnOTP} onPress={() => onPressToLoginOTP()}>
                                <Text style={{ fontWeight: FONT.FONT_WEIGHT_BOLD, color: COLOR.WHITE, fontSize: FONT.FONT_SIZE_18 }}>Login with OTP</Text>
                            </TouchableOpacity>
                        }
                        <TouchableOpacity style={{ marginTop: 30 }} onPress={() => { props.navigation.navigate(SCREEN.FORGOTPASSWORDSCREEN), resetScreen() }}>
                            <Text style={{ color: COLOR.WHITE, fontSize: FONT.FONT_SIZE_16 }}>Reset Your Password</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{ marginVertical: 20 }} />
                </ScrollView>
            </ImageBackground>
            {loading ? <Loader /> : null}
        </SafeAreaView>
    );
}

