import React, { useState, useEffect } from 'react';
import {
    View, Text, Image, TextInput, SafeAreaView, TouchableOpacity,
    ScrollView, StatusBar, FlatList, Dimensions
} from 'react-native';
import { CategoryService } from '../../services/CategoryService/CategoryService';
import WallateButton from '../../components/WallateButton/WallateButton';
import Foundation from 'react-native-vector-icons/Foundation';
import AntDesign from 'react-native-vector-icons/AntDesign';
import StarRating from 'react-native-star-rating';
import Loader from '../../components/loader/index';
import * as STYLES from './styles';
import * as SCREEN from '../../context/screen/screenName';
import { TopConsultantViewListService } from '../../services/UserService/UserService';
import ActionButton from 'react-native-circular-action-menu';
const noProfile = 'https://res.cloudinary.com/dnogrvbs2/image/upload/v1613538969/profile1_xspwoy.png';
import { useFocusEffect } from '@react-navigation/native';
import GeneralStatusBarColor from '../../components/StatusBarStyle/GeneralStatusBarColor';
import crashlytics, { firebase } from "@react-native-firebase/crashlytics";
const WIDTH = Dimensions.get('window').width;

function selectCategoryScreen(props) {
    const [category, setCategory] = useState([]);
    const [consultant, setConsultant] = useState([]);
    const [loading, setloading] = useState(false);
    const [search, setSearch] = useState(null);
    const [filteredDataSource, setFilteredDataSource] = useState([]);
    const [filter, setFilter] = useState([]);

    useFocusEffect(
        React.useCallback(() => {
            setFilter([]);
            setSearch(null);
            categoryList();
            ConsultantList();
        }, [])
    );

    useEffect(() => {
        setloading(true);
    }, []);

    useEffect(() => {
    }, [category, loading, consultant, search, filteredDataSource, filter]);

    //category List Service to call function
    const categoryList = async () => {
        try {
            const response = await CategoryService();
            if (response.data != null && response.data != 'undefind' && response.status == 200) {
                var distinctItems = [];
                response.data.forEach(element => {
                    if (element["property"]["skillcategory"].toLowerCase() == 'coming soon') {
                        distinctItems.push(element)
                    } else {
                        var skillObj = distinctItems.find(p => p?.property?.skillcategory == element["property"]["skillcategory"]);
                        if (!skillObj) {
                            distinctItems.push(element)
                        }
                    }

                });
                // const uniqueValues = [...new Map(response.data.map(item =>
                //     console.log("item", item)
                //     [item["property"]["skillcategory"], item]

                // )).values()];
                setCategory(distinctItems);
                setloading(false);
            }
        } catch (error) {
            setloading(false);
            firebase.crashlytics().recordError(error);
            //  console.log(`error`, error);
        }
    }

    //category List Service to call function
    const ConsultantList = async () => {
        try {
            const response = await TopConsultantViewListService();
            if (response.data != null && response.data != 'undefind' && response.status == 200) {
                const slice = response.data.slice(0, 5)
                setFilteredDataSource(response.data);
                setConsultant(slice);
                // setloading(false);
            }
        } catch (error) {
            setloading(false);
            firebase.crashlytics().recordError(error);
            // console.log(`error`, error);
        }
    }

    //search consultants function
    const searchFilterFunction = (text) => {
        if (Number(text.length) > 3) {
            const newData = filteredDataSource.filter(item => {
                const itemData = item.fullname
                    ? item.fullname.toLowerCase()
                    : ''.toLowerCase();
                const textData = text.toLowerCase();
                return itemData.indexOf(textData) !== -1;
            });
            setFilter(newData);
            setSearch(text);
        } else {
            setSearch(text);
            setFilter([]);
        }
    };

    // Flat List Item
    const ItemView = ({ item }) => {
        return (
            <View style={{ width: WIDTH - 25 }}>
                <Text
                    style={{ padding: 10, alignItems: 'flex-start', justifyContent: 'center' }}
                    onPress={() => navigationhandler(item)}>
                    {item.fullname + ' - ' + ' Consultant'}
                </Text>
            </View>
        );
    };

    // Flat List Item Separator
    const ItemSeparatorView = () => {
        return (
            <View
                style={{
                    height: 0.5,
                    width: '100%',
                    backgroundColor: '#C8C8C8',
                }}
            />
        );
    };

    //open WEB VIEW SCREEN
    const WebViewScreen = (data) => {
        props.navigation.navigate(SCREEN.WEBVIEWSCREEN, { data });
    }

    //render category 
    const renderCategory = ({ item }) => (
        item.property && item.property.skillcategory == 'Coming Soon' ?
            <View style={{ flex: 1, padding: 0, justifyContent: 'center', alignItems: 'center' }}>
                <TouchableOpacity style={STYLES.categoryStyles.categoryview} disabled={true}>
                    <Image source={{ uri: item && item.property && item.property.image[0] && item.property.image[0].attachment }} style={{ width: 60, height: 60, borderRadius: 8, borderWidth: 0.2, borderColor: '#000000' }} />
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', marginTop: 5 }}>
                    <Text style={{ fontSize: 10, textAlign: 'center', textTransform: 'uppercase', color: '#8D8D8D' }}>{item.property.skillcategory.substring(0, 6) + ' ...'}</Text>
                    <TouchableOpacity disabled={true}>
                        <Foundation name='info' size={15} color='#82C3FC' style={{ marginLeft: 5 }} />
                    </TouchableOpacity>
                </View>
            </View>
            :
            <View style={{ flex: 1, padding: 0, justifyContent: 'center', alignItems: 'center' }}>
                <TouchableOpacity style={STYLES.categoryStyles.categoryview} onPress={() => onTouchSelectCategory(item)}>
                    <Image source={{ uri: item.property.image[0].attachment }} style={{ width: 60, height: 60, borderRadius: 8, borderWidth: 0.2, borderColor: '#000000' }} />
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', marginTop: 5 }}>
                    <Text style={{ fontSize: 10, textAlign: 'center', textTransform: 'uppercase', color: '#000000' }}>{item?.property?.skillcategory?.substring(0, 8) + ' ...'}</Text>
                    <TouchableOpacity onPress={() => WebViewScreen(item.property.link)}>
                        <Foundation name='info' size={15} color='#3399FF' style={{ marginLeft: 5 }} />
                    </TouchableOpacity>
                </View>
            </View>
    );

    //render Consultants
    const renderConsultants = ({ item }) => (
        <View style={{ flexDirection: 'column', marginBottom: 30 }}>
            <TouchableOpacity style={{ margin: 20 }} onPress={() => navigationhandler(item)}>
                <Image source={{ uri: item.profilepic ? item.profilepic : noProfile }}
                    style={{ alignItems: 'center', height: 80, width: 80, borderColor: '#2294FA', borderWidth: 2, borderRadius: 100 }}
                />
            </TouchableOpacity>
            <View>
                <Text style={{ fontSize: 14, color: '#000000', fontWeight: 'bold', textAlign: 'center', marginTop: -10, textTransform: 'capitalize' }}>
                    {item.property.first_name}
                </Text>
                <View style={{}}>
                    <Text style={{ fontSize: 12, color: '#999999', textAlign: 'center', textTransform: 'uppercase' }}>{item?.property?.usertag?.substring(0, 10)}</Text>
                </View>
                {
                    Number(item.ratinglen) > 0 ?
                        <View style={{ marginTop: -12, padding: 15, flexDirection: 'row' }}>
                            <Text style={{ fontSize: 12, color: '#000000', textAlign: 'center', marginRight: 2 }}>{item.ratinglen + 'k'}</Text>
                            <StarRating
                                disabled={false}
                                maxStars={5}
                                starSize={15}
                                rating={item.ratinglen}
                                fullStarColor={'#F1C40E'}
                                emptyStarColor={'#000000'}
                            />
                        </View>
                        :
                        <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ color: '#000000', fontSize: 12 }}>{'New'}</Text>
                        </View>
                }
            </View>
        </View>
    )

    //on touch to select category
    const onTouchSelectCategory = (item) => {
        props.navigation.navigate(SCREEN.SUBCATEGORYSCREEN, { item });
    }

    //on touch to open consultants screen
    const navigationhandler = (item) => {
        setSearch(null);
        setFilter([]);
        props.navigation.navigate(SCREEN.CONSULTANTSSCREEN, { item });
    }

    return (
        <SafeAreaView style={STYLES.categoryStyles.container}>
            <GeneralStatusBarColor hidden={false} translucent={true} backgroundColor="transparent" barStyle="dark-content" />
            <View style={{ justifyContent: 'space-between', alignItems: 'center', flexDirection: 'row', marginTop: 30 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', marginLeft: 20 }}>
                    <TouchableOpacity onPress={() => props.navigation.goBack(null)}>
                        <AntDesign name='arrowleft' color='#FFFFFF' size={24} />
                    </TouchableOpacity>
                    <View style={{ justifyContent: 'center', marginLeft: 20 }}>
                        <Text style={{ fontSize: 26, color: '#FFFFFF', fontWeight: 'bold' }}>Categories</Text>
                    </View>
                </View>
                <View style={{ justifyContent: 'flex-end' }}>
                    <WallateButton onPress={() => props.navigation.navigate(SCREEN.MYWALLETSCREEN)} />
                </View>
            </View>

            <View style={STYLES.categoryStyles.centerView}>
                <View style={STYLES.categoryStyles.statusbar}>
                    <TouchableOpacity >
                        <AntDesign name='search1' size={20} color='#3399ff' style={{ marginLeft: 20 }} />
                    </TouchableOpacity>
                    <TextInput
                        style={STYLES.categoryStyles.statInput}
                        placeholder='Search App'
                        type='clear'
                        placeholderTextColor='#999999'
                        returnKeyType='search'
                        autoCapitalize='none'
                        autoCorrect={false}
                        onChangeText={(text) => searchFilterFunction(text)}
                        defaultValue={search}
                    />
                    {/* <TouchableOpacity >
                            <Image source={require('../../assets/Images/filter.png')} style={{ width: 18, height: 20, marginRight: 20 }} />
                        </TouchableOpacity> */}
                </View>
            </View>

            {
                (filteredDataSource == null) || (filteredDataSource && filteredDataSource.length == 0) ? null :
                    <View style={{
                        marginTop: 150, backgroundColor: '#FFFFFF', position: 'absolute',
                        zIndex: 2, justifyContent: 'center', alignItems: 'center', margin: 20, height: 100
                    }}>
                        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps={'always'}>
                            <FlatList
                                data={filter}
                                keyExtractor={(item, index) => index.toString()}
                                ItemSeparatorComponent={ItemSeparatorView}
                                keyboardShouldPersistTaps={'always'}
                                renderItem={ItemView}
                            />
                        </ScrollView>
                    </View>
            }

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps={'always'}>
                <View style={{ justifyContent: 'center', alignItems: 'center', marginTop: 10 }}>
                    <View style={STYLES.categoryStyles.homeCardView}>
                        <View style={{ marginTop: 20, justifyContent: 'center', alignItems: 'center' }}>
                            <FlatList
                                renderItem={renderCategory}
                                data={category}
                                horizontal={false}
                                showsHorizontalScrollIndicator={false}
                                numColumns={4}
                                keyExtractor={item => item._id}
                                style={{ width: WIDTH - 20 }}
                            />
                        </View>

                        <View style={STYLES.categoryStyles.categoriesText}>
                            <TouchableOpacity onPress={() => props.navigation.navigate(SCREEN.NEWCHATSSCREEN)}>
                                <Text style={{ fontSize: 20, color: '#2094FA' }}>Top Consultants</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{ flexDirection: 'row', marginBottom: 20 }}>
                            <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps={'always'}>
                                <FlatList
                                    renderItem={renderConsultants}
                                    data={consultant}
                                    horizontal={false}
                                    numColumns={5}
                                    keyExtractor={item => item._id}
                                />
                            </ScrollView>
                        </View>
                        <View style={{ marginBottom: 40 }}></View>
                    </View>
                </View>
                <View style={{ marginBottom: 20 }}></View>
            </ScrollView>
            <ActionButton
                buttonColor="#00D9CE"
                position="right"
                bgColor="transparent"
                autoInactive={false}
            // icon={renderImage()}
            >
                <ActionButton.Item buttonColor='#00D9CE' size={60} title="Chat" onPress={() => props.navigation.navigate(SCREEN.RECENTCHATSCREEN)}>
                    <Image source={require('../../assets/Images/chaticon1.png')} style={{ height: 23, width: 25 }} />
                </ActionButton.Item>
                <ActionButton.Item buttonColor='#00D9CE' size={60} title="Find a counsultant" onPress={() => props.navigation.navigate(SCREEN.NEWCHATSSCREEN)}>
                    <Image source={require('../../assets/Images/findicon.png')} style={{ height: 20, width: 20 }} />
                </ActionButton.Item>
                <ActionButton.Item buttonColor='#00D9CE' size={60} title="Wallet Balance" onPress={() => props.navigation.navigate(SCREEN.MYWALLETSCREEN)}>
                    <Image source={require('../../assets/Images/moneyicon.png')} style={{ height: 20, width: 15 }} />
                </ActionButton.Item>
            </ActionButton>
            {loading ? <Loader /> : null}
        </SafeAreaView>
    )
}

export default selectCategoryScreen
